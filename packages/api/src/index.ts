import './accordion'
import './autocomplete'
import './dialog'
import './dropdown'
import './options'
import './popover'
import './select'
import './spotlight'
import './tabs'

typeof globalThis.window !== "undefined" && setTimeout(( () => window.dispatchEvent(new Event("elements:ready"))));
