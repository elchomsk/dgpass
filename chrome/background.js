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
    function encode_uld(ushort)
    {
        let digit = DIGITS[ushort % 10];
        ushort = Math.floor(ushort / 10);

        let lower = LOWERCASE[ushort % 26];
        ushort = Math.floor(ushort / 26);

        let upper = UPPERCASE[ushort % 26];
        ushort = Math.floor(ushort / 26);

        let p = PERMS[ushort % 6];

        let result = ['', '', ''];
        result[p[0]] = upper;
        result[p[1]] = lower;
        result[p[2]] = digit;

        return result.join('');
    }


    ////////////////////////////////////////////////////////////////////
    function encode_ushort(ushort)
    {
        if (ushort >= 65534) {
            return ''
        }

        return ENCODING[ushort % 62]
    }


    ////////////////////////////////////////////////////////////////////
    function encode(raw, nchars)
    {
        let nums = Array.from(new Uint16Array(raw));
        let prefix = nums[0];
        let suffix = nums.slice(1);

        let result = encode_uld(prefix) + suffix.map(encode_ushort).join('');

        if (result.length < nchars) {
            return null;
        }

        return result.slice(0, nchars);
    }
    

    ////////////////////////////////////////////////////////////////////
    async function hash(site, salt, username, password, attempt)
    {
        let enc = new TextEncoder();

        let pbkdf2_key = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password + '|' + master_salt + '|' + salt + '|' + attempt),
            {name: 'PBKDF2'},
            false,
            ['deriveKey']
        );

        let pbkdf2 = await window.crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              hash: 'SHA-512',
              salt: enc.encode(site + '|' + username),
              iterations: 2**iterations,
            },
            pbkdf2_key,
            { 
                name: 'HMAC',
                hash: 'SHA-512',
                length: 512
            },
            true,
            [ 'sign', 'verify' ]
        );

        let key = await window.crypto.subtle.exportKey('raw', pbkdf2);

        return(encode(key, 16));
    }


    ////////////////////////////////////////////////////////////////////
    async function generate_hashed(site, salt, username, password)
    {
        if ((site === null) || (salt === null) || (username === null) || (password === null)) {
            return null;
        }

        for (let attempt=0; attempt<2; ++attempt) {
            let pass = await hash(site, salt, username, password, 0)            
            if (pass !== null) {
                return pass;
            }    
        }

        return null;
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
                prom.then(function(hashed) {chrome.runtime.sendMessage({msg: 'hashed', instance: msg.instance, hashed: hashed})});
                break;

            case 'options':
                get_options();
                break;

            case 'show_options':
                chrome.runtime.openOptionsPage();
                break;
        }
    });


    get_options();    
});
