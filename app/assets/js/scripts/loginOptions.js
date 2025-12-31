const loginOptionsCancelContainer = document.getElementById('loginOptionCancelContainer')
const loginOptionMicrosoft = document.getElementById('loginOptionMicrosoft')
const loginOptionMojang = document.getElementById('loginOptionMojang')
const loginOptionsCancelButton = document.getElementById('loginOptionCancelButton')
const loginOptionOffline = document.getElementById('loginOptionOffline')

let isOfflineMode = false
let loginOptionsCancellable = false

let loginOptionsViewOnLoginSuccess
let loginOptionsViewOnLoginCancel
let loginOptionsViewOnCancel
let loginOptionsViewCancelHandler

function loginOptionsCancelEnabled(val){
    if(val){
        $(loginOptionsCancelContainer).show()
    } else {
        $(loginOptionsCancelContainer).hide()
    }
}

// Botão Microsoft
if (loginOptionMicrosoft) {
    loginOptionMicrosoft.onclick = (e) => {
        isOfflineMode = false
        switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
            ipcRenderer.send(
                MSFT_OPCODE.OPEN_LOGIN,
                loginOptionsViewOnLoginSuccess,
                loginOptionsViewOnLoginCancel
            )
        })
    }
}

// Botão Offline (A LÓGICA MÁGICA ESTÁ AQUI)
if (loginOptionOffline) {
    loginOptionOffline.onclick = (e) => {
        isOfflineMode = true // Ativa modo offline
        switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
            loginViewOnSuccess = loginOptionsViewOnLoginSuccess
            loginViewOnCancel = loginOptionsViewOnLoginCancel
            loginCancelEnabled(true)
            
            // 1. Esconde Senha
            if (typeof loginPassword !== 'undefined' && loginPassword.parentElement) {
                loginPassword.parentElement.style.display = 'none'
            }

            // 2. Muda Placeholder
            if (typeof loginUsername !== 'undefined') {
                loginUsername.placeholder = "Nick do Minecraft"
                loginUsername.value = ''
            }

            // 3. Esconde Links Extras
            const forgotPass = document.querySelector('#loginOptions .loginSpanDim')
            if (forgotPass) forgotPass.style.display = 'none'
            
            const registerSpan = document.getElementById('loginRegisterSpan')
            if (registerSpan) registerSpan.style.display = 'none'

            // 4. ESCONDE O TEXTO CHATO DO RODAPÉ (Disclaimer)
            const disclaimer = document.getElementById('loginDisclaimer')
            if (disclaimer) {
                disclaimer.style.display = 'none'
            }
        })
    }
}

// Botão Mojang (Login Comum)
if (loginOptionMojang) {
    loginOptionMojang.onclick = (e) => {
        isOfflineMode = false
        switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
            loginViewOnSuccess = loginOptionsViewOnLoginSuccess
            loginViewOnCancel = loginOptionsViewOnLoginCancel
            loginCancelEnabled(true)
            
            // Garante que tudo aparece no login normal
            if (typeof loginPassword !== 'undefined' && loginPassword.parentElement) {
                loginPassword.parentElement.style.display = 'flex'
            }
            const forgotPass = document.querySelector('#loginOptions .loginSpanDim')
            if (forgotPass) forgotPass.style.display = 'block'
            
            const registerSpan = document.getElementById('loginRegisterSpan')
            if (registerSpan) registerSpan.style.display = 'block'

            const disclaimer = document.getElementById('loginDisclaimer')
            if (disclaimer) disclaimer.style.display = 'flex'
        })
    }
}

// Botão Cancelar (Restaura tudo ao normal)
if (loginOptionsCancelButton) {
    loginOptionsCancelButton.onclick = (e) => {
        isOfflineMode = false
        switchView(getCurrentView(), loginOptionsViewOnCancel, 500, 500, () => {
            
            // Restaura campos
            if (typeof loginUsername !== 'undefined') {
                loginUsername.value = ''
                loginUsername.placeholder = "E-mail ou Nome de Usuário"
            }
            if (typeof loginPassword !== 'undefined') {
                loginPassword.value = ''
                if (loginPassword.parentElement) {
                    loginPassword.parentElement.style.display = 'flex'
                }
            }

            // Restaura textos escondidos
            const forgotPass = document.querySelector('#loginOptions .loginSpanDim')
            if (forgotPass) forgotPass.style.display = 'block'

            const registerSpan = document.getElementById('loginRegisterSpan')
            if (registerSpan) registerSpan.style.display = 'block'

            const disclaimer = document.getElementById('loginDisclaimer')
            if (disclaimer) disclaimer.style.display = 'flex'
            
            if(loginOptionsViewCancelHandler != null){
                loginOptionsViewCancelHandler()
                loginOptionsViewCancelHandler = null
            }
        })
    }
}