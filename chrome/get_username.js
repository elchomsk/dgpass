(function() {
    var username = null;

    var inputs = document.getElementsByTagName('input');
    for(var i=0; i<inputs.length; ++i) {
        var input = inputs[i];

        if (input.type === 'text') {
            if ((input.name.toLowerCase().indexOf("login")!=-1) ||
                (input.name.toLowerCase().indexOf("user")!=-1)) {
                chrome.runtime.sendMessage({msg: 'username', id: input.id, username: input.value});
                return;
            }
        }
    }

    var elem = document.getElementById('profileIdentifier');
    if (elem !== null) {
        chrome.runtime.sendMessage({msg: 'username', id: elem.id, username: elem.innerText});
        console.log(elem.innerText);
        return;
    }

    chrome.runtime.sendMessage({msg: 'username', id: null, username: null});
}());