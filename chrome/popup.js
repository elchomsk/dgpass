document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    let instance = Date.now();


    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

        switch(msg.msg) {

            case 'username':
                if (msg.site !== null) {
                    let site = document.getElementById('dgpass_site');
                    if (site !== null) {
                        site.value = msg.site;
                    }
                }
                if (msg.username !== null) {
                    let username = document.getElementById('dgpass_username');
                    if (username !== null) {
                        username.value = msg.username;            
                    }
                }
                break;

            case 'hashed':
                if (instance != msg.instance) {
                    break;
                }
                if (msg.hashed !== null) {
                    let hashed = document.getElementById('dgpass_hash');
                    if (hashed !== null) {
                        hashed.value = msg.hashed;
                    }
                }
                break;
        }
    });


    document.getElementById('dgpass_generate').addEventListener('click', function() {
        let site = document.getElementById('dgpass_site');
        let salt = document.getElementById('dgpass_salt');
        let username = document.getElementById('dgpass_username');
        let password = document.getElementById('dgpass_password');
        if ((site === null) || (salt === null) || (username === null) || (password === null)) {
            return;
        }
        let msg = {msg: 'generate',
                   instance: instance,
                   site: site.value,
                   salt: salt.value,
                   username: username.value,
                   password: password.value}
        let hashed = document.getElementById('dgpass_hash');
        if (hashed !== null) {
            hashed.value = "[generating...]";
        }
        chrome.runtime.sendMessage(msg);
    });


    document.getElementById('dgpass_autofill').addEventListener('click', function() {
        let site = document.getElementById('dgpass_site');
        let salt = document.getElementById('dgpass_salt');
        let username = document.getElementById('dgpass_username');
        let password = document.getElementById('dgpass_password');
        if ((site === null) || (salt === null) || (username === null) || (password === null)) {
            return;
        }
        let msg = {msg: 'autofill',
                   site: site.value,
                   salt: salt.value,
                   username: username.value,
                   password: password.value}
        chrome.runtime.sendMessage(msg);
        window.close();
    });


    document.getElementById('dgpass_options').onclick = function() {
        chrome.runtime.sendMessage({msg: 'show_options'});
    }

    chrome.runtime.sendMessage({msg: 'loaded'});
}, false);

