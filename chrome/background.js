document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    const ITERATIONS_DEFAULT = 20;
    
    const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const UPPERCASE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const LOWERCASE = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const ENCODING = UPPERCASE.concat(LOWERCASE).concat(DIGITS);

    var master_salt = null;
    var iterations;


    ////////////////////////////////////////////////////////////////////
    function get_options()
    {
        chrome.storage.local.get(['salt', 'iterations'], function(result) {
            master_salt = '';
            iterations = ITERATIONS_DEFAULT;
            if ((result.salt !== null) && (typeof result.salt !== 'undefined')) {
                master_salt = result.salt;
            }
            if ((result.iterations !== null) && (typeof result.iterations !== 'undefined')) {
                iterations = result.iterations;
            }
        });

    }


    ////////////////////////////////////////////////////////////////////
    function encode_uld(num)
    {
        let digit = DIGITS[num % 10];
        num = Math.floor(num / 10);

        let lower = LOWERCASE[num % 26];
        num = Math.floor(num / 26);

        let upper = UPPERCASE[num % 26];
        num = Math.floor(num / 26);

        let p = PERMS[num % 6];

        let result = ['', '', ''];
        result[p[0]] = upper;
        result[p[1]] = lower;
        result[p[2]] = digit;

        return result.join('');
    }


    ////////////////////////////////////////////////////////////////////
    function encode(raw, nchars)
    {
        if (raw.length < (nchars-1)) {
            throw("raw array is too short");
        }

        let prefix = (new Uint16Array(raw))[0];
        let suffix = Array.from(new Uint8Array(raw)).slice(2, nchars-1);

        return encode_uld(prefix) + suffix.map(b => ENCODING[b % ENCODING.length]).join('');
    }
    

    ////////////////////////////////////////////////////////////////////
    async function generate_hashed(site, salt, username, password)
    {
        if ((site === null) || (salt === null) || (username === null) || (password === null)) {
            return null;
        }

        let enc = new TextEncoder();

        console.log('key: ', password + '|' + master_salt + '|' + salt);
        console.log('salt: ', site + '|' + username)
        console.log('itrations: 2**' + iterations);

        let pbkdf2_key = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password + '|' + master_salt + '|' + salt),
            {name: 'PBKDF2'},
            false,
            ['deriveKey']
        );

        let pbkdf2 = await window.crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              hash: 'SHA-256',
              salt: enc.encode(site + '|' + username),
              iterations: 2**iterations,
            },
            pbkdf2_key,
            { 
                name: 'HMAC',
                hash: 'SHA-256',
                length: 128
            },
            true,
            [ 'sign', 'verify' ]
        );

        let key = await window.crypto.subtle.exportKey('raw', pbkdf2);

        return(encode(key, 16));
    }


    ////////////////////////////////////////////////////////////////////
    function resolve_tab(handler, msg)
    {
        chrome.tabs.query({active: true,  'lastFocusedWindow': true}, function(tabs) {
            if (tabs.length == 0) {
                return;
            }
            var tab = tabs[0];

            handler(tab, msg);
        });
    }


    ////////////////////////////////////////////////////////////////////
    function handle_loaded(tab, msg)
    {
        if (!tab.url.startsWith('http')) {
            return;
        }
        chrome.tabs.executeScript(tab.id, {file: 'get_username.js'});
    }


    function handle_username(tab, msg)
    {
        var site = (new URL(tab.url)).hostname;

        msg.site = site;

        chrome.runtime.sendMessage(msg);
    }


    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        switch(msg.msg) {

            case 'loaded':
                resolve_tab(handle_loaded, msg);
                break;

            case 'username':
                resolve_tab(handle_username, msg);
                break;

            case 'generate':
                let prom = generate_hashed(msg.site, msg.salt, msg.username, msg.password);
                prom.then(function(hashed) {console.log('instance'+msg.instance); chrome.runtime.sendMessage({msg: 'hashed', instance: msg.instance, hashed: hashed})});
                break;

            case 'options':
                get_options();
                break;
        }
    });


    get_options();    
});
