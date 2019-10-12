document.addEventListener('DOMContentLoaded', function() {
    "use strict";
    
    const ITERATIONS_VALS = [16, 18, 20, 22, 24];
    const ITERATIONS_DEFAULT = 20;

    function restore_options()
    {
        chrome.storage.local.get(['salt', 'iterations'], function(result) {
            let salt = result.salt;
            let iterations = result.iterations;

            if (typeof salt === 'undefined') {
                salt = '';
            }
            if (typeof iterations === 'undefined') {
                iterations = ITERATIONS_DEFAULT;
            }

            console.log('dgpass_iterations_' + iterations);
            
            document.getElementById('dgpass_salt').value = result.salt;
            document.getElementById('dgpass_iterations_' + iterations).checked = true;
        });
    }

    function save_options()
    {
        let salt = document.getElementById('dgpass_salt').value;
        let iterations = ITERATIONS_DEFAULT;

        for (let i=0; i<ITERATIONS_VALS.length; ++i) {
            let id = 'dgpass_iterations_' + ITERATIONS_VALS[i];
            let button = document.getElementById(id);
            if (button.checked) {
                iterations = ITERATIONS_VALS[i];
            }
        }

        chrome.storage.local.set({salt: salt, iterations:iterations}, function() {
            chrome.runtime.sendMessage({msg: 'options'});
        });
    }

    document.getElementById('dgpass_options').addEventListener('submit', function(event) {
        event.preventDefault();
        save_options();
        window.close();
    });

    restore_options();
});
