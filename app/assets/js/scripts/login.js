/**
 * Script for login.ejs
 */
// Validation Regexes.
const validUsername         = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const loginCancelContainer  = document.getElementById('loginCancelContainer')
const loginCancelButton     = document.getElementById('loginCancelButton')
const loginEmailError       = document.getElementById('loginEmailError')
const loginUsername         = document.getElementById('loginUsername')
const loginPasswordError    = document.getElementById('loginPasswordError')
const loginPassword         = document.getElementById('loginPassword')
const checkmarkContainer    = document.getElementById('checkmarkContainer')
const loginRememberOption   = document.getElementById('loginRememberOption')
const loginButton           = document.getElementById('loginButton')
const loginForm             = document.getElementById('loginForm')

// Control variables.
let lu = false, lp = false


/**
 * Show a login error.
 * * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * * @param {string} value The email value.
 */
function validateEmail(value){
    // NOVO: Verifica se estamos no modo offline.
    const offline = typeof isOfflineMode !== 'undefined' && isOfflineMode
    
    if(value){
        // MODO ONLINE: Requer email ou username Minecraft.
        if(!offline && !basicEmail.test(value) && !validUsername.test(value)){
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
            loginDisabled(true)
            lu = false
        // MODO OFFLINE: Requer apenas um username Minecraft válido.
        } else if (offline && !validUsername.test(value)) {
             showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
             loginDisabled(true)
             lu = false
        } else {
            loginEmailError.style.opacity = 0
            lu = true
            // NOVO: Se estiver offline, ignora a senha e habilita o botão.
            if(lp || offline){  // Se for offline, lp sempre será tratado como true/irrelevante.
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(loginEmailError, Lang.queryJS('login.error.requiredValue'))
        loginDisabled(true)
    }
}

/**
 * Validate that the password field is not empty.
 * * @param {string} value The password value.
 */
function validatePassword(value){
    // NOVO: Se estivermos no modo offline, a validação de senha é ignorada (lp = true).
    if (typeof isOfflineMode !== 'undefined' && isOfflineMode) {
        lp = true;
        // Se o username estiver válido, habilitamos o botão.
        if (lu) {
            loginDisabled(false)
        }
        return;
    }
    
    // Lógica Original (para login online).
    if(value){
        loginPasswordError.style.opacity = 0
        lp = true
        if(lu){
            loginDisabled(false)
        }
    } else {
        lp = false
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'))
        loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginUsername.addEventListener('focusout', (e) => {
    validateEmail(e.target.value)
    shakeError(loginEmailError)
})
loginPassword.addEventListener('focusout', (e) => {
    validatePassword(e.target.value)
    shakeError(loginPasswordError)
})

// Validate input for each field.
loginUsername.addEventListener('input', (e) => {
    validateEmail(e.target.value)
})
loginPassword.addEventListener('input', (e) => {
    validatePassword(e.target.value)
})

/**
 * Enable or disable the login button.
 * * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v){
    if(loginButton.disabled !== v){
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v){
    if(v){
        loginButton.setAttribute('loading', v)
        // Correção: Para evitar erro de substituição se o texto não existir
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loginButtonText'), Lang.queryJS('login.loggingIn'))
    } else {
        loginButton.removeAttribute('loading')
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.loginButtonText'))
    }
}

/**
 * Enable or disable login form.
 * * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v){
    loginDisabled(v)
    loginCancelButton.disabled = v
    loginUsername.disabled = v
    
    // NOVO: Se for modo offline, a senha pode estar oculta e não deve ser desabilitada/habilitada.
    if (!(typeof isOfflineMode !== 'undefined' && isOfflineMode && $(loginPassword.parentElement).is(':hidden'))) {
        loginPassword.disabled = v
    }
    
    if(v){
        checkmarkContainer.setAttribute('disabled', v)
    } else {
        checkmarkContainer.removeAttribute('disabled')
    }
    loginRememberOption.disabled = v
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

function loginCancelEnabled(val){
    if(val){
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
    }
}

loginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = ''
        loginPassword.value = ''
        loginCancelEnabled(false)
        if(loginViewCancelHandler != null){
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
    })
}

// Disable default form behavior.
loginForm.onsubmit = () => { return false }

// Modificado: Bind login button behavior.
loginButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    const username = loginUsername.value
    const password = loginPassword.value
    
    // NOVO: LÓGICA CONDICIONAL DE AUTENTICAÇÃO
    let authPromise
    
    if (typeof isOfflineMode !== 'undefined' && isOfflineMode) {
        // --- FLUXO DE LOGIN OFFLINE (Guest/Offline) ---
        
        // Assumimos que 'AuthManager.addMojangAccount' pode ser substituído
        // por um método de login offline/convidado, como 'AuthManager.addGuestAccount'.
        // O nome do método pode variar no Helios Launcher. Vamos assumir que 
        // existe um método 'addGuestAccount' ou reusaremos 'addMojangAccount' com null para a senha.
        
        // Nota: O método de login offline real precisa ser adicionado ao AuthManager.
        // Se o AuthManager suportar, usaremos:
        authPromise = AuthManager.addGuestAccount(username)
        
        // Se não houver addGuestAccount, precisamos de um Polyfill (Substituto)
        if (typeof AuthManager.addGuestAccount === 'undefined') {
            console.warn("AuthManager.addGuestAccount não encontrado. Usando addMojangAccount com senha nula como substituto.")
             authPromise = AuthManager.addMojangAccount(username, null)
        }

    } else {
        // --- FLUXO DE LOGIN ONLINE (Mojang ou Microsoft) ---
        authPromise = AuthManager.addMojangAccount(username, password)
    }

    // O restante do código de sucesso/erro usa a 'authPromise'
    authPromise.then((value) => {
        updateSelectedAccount(value)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, async () => {
                // Temporary workaround
                if(loginViewOnSuccess === VIEWS.settings){
                    await prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                
                // NOVO: Se o campo de senha foi ocultado, reexibe-o após o login.
                if (loginPassword.parentElement) {
                    $(loginPassword.parentElement).show()
                }
                
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.loginButtonText'))
                formDisabled(false)
            })
        }, 1000)
    }).catch((displayableError) => {
        loginLoading(false)

        let actualDisplayableError
        if(isDisplayableError(displayableError)) {
            msftLoginLogger.error('Error while logging in.', displayableError)
            actualDisplayableError = displayableError
        } else {
            // Uh oh.
            msftLoginLogger.error('Unhandled error during login.', displayableError)
            actualDisplayableError = Lang.queryJS('login.error.unknown')
        }

        setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
    })

})