(function() {
    "use strict";

    let username = null;

    let inputs = document.getElementsByTagName('input');
    for(let i=0; i<inputs.length; ++i) {
        let input = inputs[i];

        if (input.type === 'text') {
            let autocomplete = input.getAttribute('autocomplete');
            if (autocomplete !== null) {
                if (autocomplete.toLowerCase().indexOf('username') !== -1) {
                    chrome.runtime.sendMessage({msg: 'username', id: input.id, username: input.value});
                    return;
                }
            }

            let name = input.name.toLowerCase();
            if ((name.indexOf('login') != -1) ||
                (name.indexOf('user') != -1)) {
                chrome.runtime.sendMessage({msg: 'username', id: input.id, username: input.value});
                return;
            }
        }

    }

    let elem = document.getElementById('profileIdentifier');
    if (elem !== null) {
        chrome.runtime.sendMessage({msg: 'username', id: elem.id, username: elem.innerText});
        return;
    }

    chrome.runtime.sendMessage({msg: 'username', id: null, username: null});
}());