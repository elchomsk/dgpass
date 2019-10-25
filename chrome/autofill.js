(function() {
    "use strict";

    const passwd = 'passwd_placeholder';
    console.log('passwd: ' + passwd);

    let type_elems = [];
    let name_elems = [];

    const inputs = document.getElementsByTagName('input');
    for(let i=0; i<inputs.length; ++i) {
        const input = inputs[i];

        const autocomplete = input.getAttribute('autocomplete');
        if (autocomplete !== null) {
            if (autocomplete.toLowerCase().indexOf('current-password') !== -1) {
                input.value = passwd;
                return;
            }
        }

        let typematch = false;
        let namematch = false;

        if (input.type === 'password') {
            type_elems.push(input);
            typematch = true;
        }
        else if (input.type !== 'text') {
            continue;
        }
        
        const name = input.name.toLowerCase();
        if ((name.indexOf('password') != -1) ||
            (name.indexOf('passwd') != -1)) {
            namematch = true;
            name_elems.push(input);
        }

        if (typematch && namematch) {
            input.value = passwd;
            return;
        }
    }

    if (type_elems.length > 0) {
        type_elems[0].value = passwd;
        return;
    }

    if (name_elems.length > 0) {
        name_elems[0].value = passwd;
        return;
    }
}());
