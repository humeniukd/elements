# Elements Documentation

Elements is a JavaScript UI component library that powers all the interactive behavior in our HTML snippets. It has no dependencies on JavaScript frameworks like React, and works with any modern stack—Next.js, Rails, Laravel, Svelte, Astro, or even plain HTML.

## Available components

Elements includes the following UI components:

- [Autocomplete](#autocomplete)
- [Command palette](#command-palette)
- [Dialog](#dialog)
- [Disclosure](#disclosure)
- [Dropdown menu](#dropdown-menu)
- [Popover](#popover)
- [Select](#select)
- [Tabs](#tabs)

## Browser support

Elements targets the same modern browsers supported by Tailwind CSS v4.0, and relies on the following minimum versions:

- **Chrome 111** _(released March 2023)_
- **Safari 16.4** _(released March 2023)_
- **Firefox 128** _(released July 2024)_

## Installing in your project

The easiest way to install Elements is via the CDN. To do this, add the following script to your project's `<head>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/ce-elements@1" type="module"></script>
```

Alternatively, if you have a build pipeline you can also install it via npm:

```bash
npm install ce-elements
```

Next, import Elements into your root layout:

```js
import 'ce-elements'
```

## Detecting when ready

Sometimes you may want to add additional functionality to the Elements' components using JavaScript. To do this you must ensure that Elements has been loaded and is ready before interacting with it. You can do this by listening to the `elements:ready` event on the `window` object:

```js
function myFunction() {
  let autocomplete = document.getElementById('autocomplete')
  // Do something with the autocomplete element
}

if (customElements.get('ce-autocomplete')) {
  myFunction()
} else {
  window.addEventListener('elements:ready', myFunction)
}
```

## Autocomplete

The `<ce-autocomplete>` component is a text input that allows users to enter arbitrary values or select from a list of filtered suggestions. It behaves like a native`<datalist>`, but offers greater control over styling.

### Component API

#### `<ce-autocomplete>`

The main autocomplete component that manages form integration, filtering, and coordinates with its child components

| Type                      | Name           | Description                               |
| ------------------------- | -------------- | ----------------------------------------- |
| CSS variables (Read-only) | --input-width  | Provides the width of the input element.  |
| CSS variables (Read-only) | --button-width | Provides the width of the button element. |

#### `<ce-options>`

The options container that handles the popover behavior.

| Type                        | Name            | Description                                                                                |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Attributes                  | popover         | Required to enable the popover behavior.                                                   |
| Attributes                  | anchor          | Configures the way the options are anchored to the button.                                 |
| Attributes                  | anchor-strategy | Sets the `position` CSS property of the popover to either `absolute` (default) or `fixed`. |
| CSS variables               | --anchor-gap    | Sets the gap between the anchor and the popover.                                           |
| CSS variables               | --anchor-offset | Sets the distance that the popover should be nudged from its original position.            |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out.                               |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                                                             |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                                                            |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                                                      |
| Methods                     | togglePopover() | Toggles the options visibility.                                                            |
| Methods                     | showPopover()   | Shows the options.                                                                         |
| Methods                     | hidePopover()   | Hides the options.                                                                         |

#### `<ce-option>`

Individual selectable option within the autocomplete.

| Type                        | Name          | Description                                       |
| --------------------------- | ------------- | ------------------------------------------------- |
| Attributes                  | value         | The value of the option (required for selection). |
| Attributes                  | disabled      | Whether the option is disabled.                   |
| ARIA attributes (Read-only) | aria-selected | Present when the option is selected.              |

#### `<ce-selectedcontent>`

Automatically displays the content of the currently selected option.

### Examples

#### Basic example

Use the `<ce-autocomplete>` and `<ce-options>` components, along with a native `<input>` and `<button>`, to build an autocomplete input:

```html
<ce-autocomplete>
  <input name="user" />
  <button type="button">
    <svg><!-- ... --></svg>
  </button>

  <ce-options popover>
    <ce-option value="Wade Cooper">Wade Cooper</ce-option>
    <ce-option value="Tom Cooper">Tom Cooper</ce-option>
    <ce-option value="Jane doe">Jane Doe</ce-option>
  </ce-options>
</ce-autocomplete>
```

#### Positioning the dropdown

Add the `anchor` prop to the `<ce-options>` to automatically position the dropdown relative to the `<input>`:

```html
<ce-options popover anchor="bottom start">
  <!-- ... -->
</ce-options>
```

Use the values `top`, `right`, `bottom`, or `left` to center the dropdown along the appropriate edge, or combine it with `start` or `end` to align the dropdown to a specific corner, such as `top start` or `bottom end`.

To control the gap between the input and the dropdown, use the `--anchor-gap` CSS variable:

```html
<ce-options popover anchor="bottom start" class="[--anchor-gap:4px]">
  <!-- ... -->
</ce-options>
```

Additionally, you can use `--anchor-offset` to control the distance that the dropdown should be nudged from its original position.

#### Setting the dropdown width

The `<ce-options>` has no width set by default, but you can add one using CSS:

```html
<ce-options popover class="w-52">
  <!-- ... -->
</ce-options>
```

If you'd like the dropdown width to match the `<input>` width, use the `--input-width` CSS variable that's exposed on the `<ce-options>` element:

```html
<ce-options popover class="w-(--input-width)">
  <!-- ... -->
</ce-options>
```

#### Adding transitions

To animate the opening and closing of the dropdown, target the `data-closed`, `data-enter`, `data-leave`, and `data-transition` attributes with CSS to style the different stages of the transition:

```html
<ce-options
  popover
  class="transition transition-discrete data-closed:opacity-0 data-enter:duration-75 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
>
  <!-- ... -->
</ce-options>
```

#### Disabling the input

To disable the input, add the `disabled` attribute to the `<input>`:

```html
<ce-autocomplete>
  <input name="user" disabled />

  <!-- ... -->
</ce-autocomplete>
```

## Command palette

The `<ce-command-palette>` component provides a fast, keyboard-friendly way for users to search and select from a predefined list of options. It's typically displayed inside a dialog — often triggered with a `Cmd+K` shortcut — making it ideal for building power-user features like global searches.

### Component API

#### `<ce-command-palette>`

The main command component that manages filtering and coordinates with its child components

| Type       | Name                  | Description                                                                                                                                                                  |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attributes | name                  | The form field name for the command when used in forms.                                                                                                                      |
| Attributes | value                 | The selected value of the command. Can be read and set programmatically.                                                                                                     |
| Events     | change                | Dispatched when the active item changes. Detail contains `relatedTarget` property with the active item or `null`.                                                            |
| Methods    | setFilterCallback(cb) | Allows you to customize the filtering behavior of the command. The callback receives an object with `query`, `node` and `content` properties, and should return a `boolean`. |
| Methods    | reset()               | Resets the command to its initial state.                                                                                                                                     |

#### `<ce-command-list>`

Contains all the command items and groups. All focusable children will be considered options.

#### `<ce-defaults>`

Optional container for suggestion items that are shown when the input is empty.

#### `<ce-command-group>`

Groups related command items together.

#### `<ce-no-results>`

Optional element shown when no items match the current query.

#### `<ce-command-preview>`

Optional preview content shown when a specific item is active.

| Type       | Name | Description                                                   |
| ---------- | ---- | ------------------------------------------------------------- |
| Attributes | for  | The `id` of the item this preview content is associated with. |

### Examples

#### Basic example

Use the `<ce-command-palette>`, `<ce-command-list>`, `<ce-no-results>` components, along with a native `<input>`, to build a command palette:

```html
<ce-dialog>
  <dialog>
    <ce-command-palette>
      <input autofocus placeholder="Search…" />

      <ce-command-list>
        <button hidden type="button">Option #1</button>
        <button hidden type="button">Option #2</button>
        <button hidden type="button">Option #3</button>
      </ce-command-list>

      <ce-no-results hidden>No results found.</ce-no-results>
    </ce-command-palette>
  </dialog>
</ce-dialog>
```

## Dialog

The `<ce-dialog>` component is a lightweight wrapper around the native `<dialog>` element that adds scroll locking, click-outside-to-close support, and smooth exit transitions that work consistently across all browsers. It builds on standard HTML APIs while making dialogs easier to use and style.

### Component API

#### `<ce-dialog>`

Wrapper around the native `<dialog>` element used to manage the open state and transitions.

| Type                        | Name            | Description                                                                                                                                              |
| --------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attributes                  | open            | A boolean attribute that indicates whether the dialog is open or closed. You can change the attribute to dynamically open or close the dialog.           |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out.                                                                                             |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                                                                                                                           |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                                                                                                                          |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                                                                                                                    |
| Events                      | open            | Dispatched when the dialog is opened in any way other than by updating the `open` attribute.                                                             |
| Events                      | close           | Dispatched when the dialog is closed in any way other than by updating the `open` attribute.                                                             |
| Events                      | cancel          | Dispatched when the user attempts to dismiss the dialog via Escape key or clicking outside. Calling `preventDefault()` prevents the dialog from closing. |
| Methods                     | show()          | Shows the dialog in modal mode.                                                                                                                          |
| Methods                     | hide()          | Hides the dialog. Takes an optional object with a `restoreFocus` property to disable the default focus restoration.                                      |

#### `<dialog>`

The native dialog element.

| Type     | Name       | Description        |
| -------- | ---------- | ------------------ |
| Commands | show-modal | Opens the dialog.  |
| Commands | close      | Closes the dialog. |

#### `<ce-dialog-backdrop>`

The visual backdrop behind your dialog panel.

| Type                        | Name            | Description                                                  |
| --------------------------- | --------------- | ------------------------------------------------------------ |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out. |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                               |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                              |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                        |

#### `<ce-dialog-panel>`

The main content area of your dialog. Clicking outside of this will trigger the dialog to close.

| Type                        | Name            | Description                                                  |
| --------------------------- | --------------- | ------------------------------------------------------------ |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out. |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                               |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                              |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                        |

### Examples

#### Basic example

Use the `<ce-dialog>` and `<ce-dialog-panel>` components, along with a native `<dialog>`, to build a dialog:

```html
<button command="show-modal" commandfor="delete-profile" type="button">Delete profile</button>

<ce-dialog>
  <dialog id="delete-profile">
    <ce-dialog-panel>
      <form method="dialog">
        <h3>Delete profile</h3>
        <p>Are you sure? This action is permanent and cannot be undone.</p>
        <div class="flex gap-4">
          <button command="close" commandfor="delete-profile" type="button">Cancel</button>
          <button type="submit">Delete</button>
        </div>
      </form>
    </ce-dialog-panel>
  </dialog>
</ce-dialog>
```

#### Opening the dialog

You can open dialogs using the `show-modal` [invoker command](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API):

```html
<button command="show-modal" commandfor="delete-profile" type="button">Open dialog</button>

<ce-dialog>
  <dialog id="delete-profile"><!-- ... --></dialog>
</ce-dialog>
```

Alternatively you can add the `open` attribute to the `<ce-dialog>` to open it:

```diff
- <ce-dialog>
+ <ce-dialog open>
    <dialog><!-- ... --></dialog>
  </ce-dialog>
```

You can also programmatically open the dialog using the `show()` method on `<ce-dialog>`:

```html
<ce-dialog id="delete-profile">
  <dialog><!-- ... --></dialog>
</ce-dialog>

<script type="module">
  const dialog = document.getElementById('delete-profile')
  dialog.show()
</script>
```

#### Closing the dialog

You can close dialogs using the `close` [invoker command](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API):

```html
<button command="close" commandfor="delete-profile" type="button">Close dialog</button>

<ce-dialog>
  <dialog id="delete-profile"><!-- ... --></dialog>
</ce-dialog>
```

Alternatively you can remove the `open` attribute from the `<ce-dialog>` to close it:

```diff
- <ce-dialog open>
+ <ce-dialog>
    <dialog><!-- ... --></dialog>
  </ce-dialog>
```

You can also programmatically close the dialog using the `hide()` method on `<ce-dialog>`:

```html
<ce-dialog id="delete-profile">
  <dialog><!-- ... --></dialog>
</ce-dialog>

<script type="module">
  const dialog = document.getElementById('delete-profile')
  dialog.hide()
</script>
```

#### Adding a backdrop

Use the `<ce-dialog-backdrop>` component to add a backdrop behind your dialog panel:

```html
<ce-dialog>
  <dialog class="backdrop:bg-transparent">
    <ce-dialog-backdrop class="pointer-events-none bg-black/50" />
    <ce-dialog-panel><!-- ... --></ce-dialog-panel>
  </dialog>
</ce-dialog>
```

The primary benefit of using the `<ce-dialog-backdrop>` component over the native `::backdrop` pseudo-element is that it can be transitioned reliably using CSS.

#### Adding transitions

To animate the opening and closing of the dialog, target the `data-closed`, `data-enter`, `data-leave`, and `data-transition` attributes with CSS to style the different stages of the transition:

```html
<ce-dialog>
  <dialog class="backdrop:bg-transparent">
    <ce-dialog-backdrop
      class="pointer-events-none bg-black/50 transition duration-200 data-closed:opacity-0"
    />
    <ce-dialog-panel
      class="bg-white transition duration-200 data-closed:scale-95 data-closed:opacity-0"
    >
      <!-- ... -->
    </ce-dialog-panel>
  </dialog>
</ce-dialog>
```

## Disclosure

The `<ce-disclosure>` component provides a simple, accessible way to show and hide content — ideal for building things like toggleable accordion panels or expandable sections.

### Component API

#### `<ce-disclosure>`

Contains the content of the disclosure.

| Type                        | Name            | Description                                                  |
| --------------------------- | --------------- | ------------------------------------------------------------ |
| Attributes                  | hidden          | Whether the disclosure is initially hidden (closed).         |
| Attributes                  | open            | Automatically synced with the `hidden` attribute.            |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out. |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                               |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                              |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                        |
| Methods                     | show()          | Shows the disclosure.                                        |
| Methods                     | hide()          | Hides the disclosure.                                        |
| Methods                     | toggle()        | Toggles the disclosure.                                      |
| Commands                    | --show          | Shows the disclosure.                                        |
| Commands                    | --hide          | Hides the disclosure.                                        |
| Commands                    | --toggle        | Toggles the disclosure.                                      |

### Examples

#### Basic example

Use the `<ce-disclosure>` component, along with a native `<button>`, to build a disclosure:

```html
<button command="--toggle" commandfor="my-disclosure" type="button">
  What's the best thing about Switzerland?
</button>

<ce-disclosure hidden id="my-disclosure"> I don't know, but the flag is a big plus. </ce-disclosure>
```

#### Opening a disclosure

You can open disclosures using the `--show` [invoker command](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API):

```html
<button command="--show" commandfor="my-disclosure" type="button">Show disclosure</button>

<ce-disclosure hidden id="my-disclosure">
  <!-- ... -->
</ce-disclosure>
```

Alternatively you can remove the `hidden` attribute to open it:

```diff
- <ce-disclosure hidden>
+ <ce-disclosure>
    <!-- ... -->
  </ce-disclosure>
```

You can also programmatically open disclosures using the `show()` method:

```html
<ce-disclosure hidden id="my-disclosure">
  <!-- ... -->
</ce-disclosure>

<script type="module">
  const disclosure = document.getElementById('my-disclosure')
  disclosure.show()
</script>
```

#### Closing a disclosure

You can close disclosures using the `--hide` [invoker command](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API):

```html
<button command="--hide" commandfor="my-disclosure" type="button">Hide disclosure</button>

<ce-disclosure id="my-disclosure">
  <!-- ... -->
</ce-disclosure>
```

Alternatively you can add the `hidden` attribute to close it:

```diff
- <ce-disclosure>
+ <ce-disclosure hidden>
    <!-- ... -->
  </ce-disclosure>
```

You can also programmatically close disclosures using the `hide()` method:

```html
<ce-disclosure id="my-disclosure">
  <!-- ... -->
</ce-disclosure>

<script type="module">
  const disclosure = document.getElementById('my-disclosure')
  disclosure.hide()
</script>
```

#### Toggling a disclosure

You can toggle disclosures using the `--toggle` [invoker command](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API):

```html
<button command="--toggle" commandfor="my-disclosure" type="button">Toggle disclosure</button>

<ce-disclosure hidden id="my-disclosure">
  <!-- ... -->
</ce-disclosure>
```

You can also programmatically toggle disclosures using the `toggle()` method:

```html
<ce-disclosure hidden id="my-disclosure">
  <!-- ... -->
</ce-disclosure>

<script type="module">
  const disclosure = document.getElementById('my-disclosure')
  disclosure.toggle()
</script>
```

#### Adding transitions

To animate the opening and closing of the disclosure, target the `data-closed`, `data-enter`, `data-leave`, and `data-transition` attributes with CSS to style the different stages of the transition:

```html
<ce-disclosure hidden class="transition transition-discrete duration-1000 data-closed:opacity-0">
  <!-- ... -->
</ce-disclosure>
```

## Dropdown menu

The `<ce-dropdown>` component makes it easy to build dropdown menus with full keyboard support and built-in anchoring to control where the dropdown appears relative to its trigger.

### Component API

#### `<ce-dropdown>`

Connects the button with the menu.

| Type          | Name          | Description                                          |
| ------------- | ------------- | ---------------------------------------------------- |
| CSS variables | --input-width | Provides the width of the input element (read-only). |

#### `<ce-menu>`

Contains all the menu items. All focusable children will be considered options.

| Type                        | Name            | Description                                                                                            |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| Attributes                  | popover         | Required to enable the popover behavior.                                                               |
| Attributes                  | open            | Controls the open/closed state of the menu.                                                            |
| Attributes                  | anchor          | Where to position the dropdown menu. Supports values like "bottom", "bottom-start", "bottom-end", etc. |
| Attributes                  | anchor-strategy | Sets the `position` CSS property of the popover to either `absolute` (default) or `fixed`.             |
| CSS variables               | --anchor-gap    | Sets the gap between the anchor and the popover.                                                       |
| CSS variables               | --anchor-offset | Sets the distance that the popover should be nudged from its original position.                        |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out.                                           |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                                                                         |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                                                                        |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                                                                  |
| Methods                     | togglePopover() | Toggles the menu visibility.                                                                           |
| Methods                     | showPopover()   | Shows the menu.                                                                                        |
| Methods                     | hidePopover()   | Hides the menu.                                                                                        |

### Examples

#### Basic example

Use the `<ce-dropdown>` and `<ce-menu>` components, along with a native `<button>`, to build a dropdown menu:

```html
<ce-dropdown>
  <button type="button">Options</button>
  <ce-menu anchor="bottom start" popover>
    <button class="focus:bg-gray-100" type="button">Edit</button>
    <button class="focus:bg-gray-100" type="button">Duplicate</button>
    <hr role="none" />
    <button class="focus:bg-gray-100" type="button">Archive</button>
    <button class="focus:bg-gray-100" type="button">Delete</button>
  </ce-menu>
</ce-dropdown>
```

All focusable children within the `<ce-menu>` component will be considered options.

## Popover

The `<ce-popover>` component is used to display floating panels with arbitrary content — perfect for things like navigation menus and flyouts.

### Component API

#### `<ce-popover>`

Contains the content of the popover.

| Type                        | Name            | Description                                                                                      |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| Attributes                  | anchor          | Where to position the popover. Supports values like "bottom", "bottom-start", "bottom-end", etc. |
| Attributes                  | anchor-strategy | Sets the `position` CSS property of the popover to either `absolute` (default) or `fixed`.       |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out.                                     |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                                                                   |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                                                                  |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                                                            |
| Events                      | toggle          | Dispatched when the popover opens or closes.                                                     |
| Methods                     | togglePopover() | Toggles the popover visibility.                                                                  |
| Methods                     | showPopover()   | Shows the popover.                                                                               |
| Methods                     | hidePopover()   | Hides the popover.                                                                               |

#### `<ce-popover-group>`

Links related popovers to prevent them from closing when focus is moved between them.

### Examples

#### Basic example

Use the `<ce-popover-group>` component, along with a native `<button>`, to build a popover:

```html
<button popovertarget="content-a" type="button">Menu A</button>

<ce-popover id="content-a" anchor="bottom start" popover> Content A </ce-popover>
```

#### Grouping popovers

Use the `<ce-popover-group>` component to group popovers together. This prevents them from closing when focus is moved between them:

```html
<ce-popover-group>
  <button popovertarget="content-a" type="button">Menu A</button>
  <ce-popover id="content-a" anchor="bottom start" popover> Content A </ce-popover>

  <button popovertarget="content-b" type="button">Menu B</button>
  <ce-popover id="content-b" anchor="bottom start" popover> Content B </ce-popover>
</ce-popover-group>
```

## Select

The `<ce-select>` component is a fully accessible replacement for a native `<select>` element, designed to give you complete control over styling.

### Component API

#### `<ce-select>`

Manages form integration and coordinates with its child components.

| Type                      | Name          | Description                                                             |
| ------------------------- | ------------- | ----------------------------------------------------------------------- |
| Attributes                | name          | The form field name for the select when used in forms.                  |
| Attributes                | value         | The selected value of the select. Can be read and set programmatically. |
| Events                    | input         | Dispatched when the selected option changes.                            |
| Events                    | change        | Dispatched when the selected option changes.                            |
| CSS variables (Read-only) | --input-width | Provides the width of the input element (read-only).                    |

#### `<ce-options>`

The options container that handles the popover behavior.

| Type                        | Name            | Description                                                                                |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Attributes                  | popover         | Required to enable the popover behavior.                                                   |
| Attributes                  | anchor          | Configures the way the options are anchored to the button.                                 |
| Attributes                  | anchor-strategy | Sets the `position` CSS property of the popover to either `absolute` (default) or `fixed`. |
| CSS variables               | --anchor-gap    | Sets the gap between the anchor and the popover.                                           |
| CSS variables               | --anchor-offset | Sets the distance that the popover should be nudged from its original position.            |
| Data attributes (Read-only) | data-closed     | Present before transitioning in, and when transitioning out.                               |
| Data attributes (Read-only) | data-enter      | Present when transitioning in.                                                             |
| Data attributes (Read-only) | data-leave      | Present when transitioning out.                                                            |
| Data attributes (Read-only) | data-transition | Present when transitioning in or out.                                                      |
| Methods                     | togglePopover() | Toggles the options visibility.                                                            |
| Methods                     | showPopover()   | Shows the options.                                                                         |
| Methods                     | hidePopover()   | Hides the options.                                                                         |

#### `<ce-option>`

Individual selectable option within the select.

| Type                        | Name          | Description                                       |
| --------------------------- | ------------- | ------------------------------------------------- |
| Attributes                  | value         | The value of the option (required for selection). |
| Attributes                  | disabled      | Whether the option is disabled.                   |
| ARIA attributes (Read-only) | aria-selected | Present when the option is selected.              |

#### `<ce-selectedcontent>`

Automatically displays the content of the currently selected option.

### Examples

#### Basic example

Use the `<ce-select>`, `<ce-options>` and `<ce-selectedcontent>` components, along with a native `<button>`, to build a select input:

```html
<ce-select name="status" value="active">
  <button type="button">
    <ce-selectedcontent>Active</ce-selectedcontent>
  </button>
  <ce-options popover>
    <ce-option value="active">Active</ce-option>
    <ce-option value="inactive">Inactive</ce-option>
    <ce-option value="archived">Archived</ce-option>
  </ce-options>
</ce-select>
```

#### Positioning the dropdown

Add the `anchor` prop to the `<ce-options>` to automatically position the dropdown relative to the `<input>`:

```html
<ce-options popover anchor="bottom start">
  <!-- ... -->
</ce-options>
```

Use the values `top`, `right`, `bottom`, or `left` to center the dropdown along the appropriate edge, or combine it with `start` or `end` to align the dropdown to a specific corner, such as `top start` or `bottom end`.

To control the gap between the input and the dropdown, use the `--anchor-gap` CSS variable:

```html
<ce-options popover anchor="bottom start" class="[--anchor-gap:4px]">
  <!-- ... -->
</ce-options>
```

Additionally, you can use `--anchor-offset` to control the distance that the dropdown should be nudged from its original position.

#### Setting the dropdown width

The `<ce-options>` has no width set by default, but you can add one using CSS:

```html
<ce-options popover class="w-52">
  <!-- ... -->
</ce-options>
```

If you'd like the dropdown width to match the `<button>` width, use the `--button-width` CSS variable that's exposed on the `<ce-options>` element:

```html
<ce-options popover class="w-(--button-width)">
  <!-- ... -->
</ce-options>
```

#### Adding transitions

To animate the opening and closing of the dropdown, target the `data-closed`, `data-enter`, `data-leave`, and `data-transition` attributes with CSS to style the different stages of the transition:

```html
<ce-options
  popover
  class="transition transition-discrete data-closed:opacity-0 data-enter:duration-75 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
>
  <!-- ... -->
</ce-options>
```

#### Disabling the input

To disable the input, add the `disabled` attribute to the `<button>`:

```html
<ce-select name="status" value="active">
  <button type="button" disabled>
    <ce-selectedcontent>Active</ce-selectedcontent>
  </button>

  <!-- ... -->
</ce-select>
```

## Tabs

The `<ce-tab-group>` component makes it easy to build accessible, keyboard-navigable tab interfaces with full control over styling and layout.

### Component API

#### `<ce-tab-group>`

The main container that coordinates the tabs and panels.

| Type    | Name                | Description                   |
| ------- | ------------------- | ----------------------------- |
| Methods | setActiveTab(index) | Sets the active tab by index. |

#### `<ce-tab-list>`

The container for tab buttons.

#### `<ce-tab-panels>`

The container for tab panels. All direct children are considered panels.

### Examples

#### Basic example

Use the `<ce-tab-group>`, `<ce-tab-list>`, and `<ce-tab-panels>` components, along with native `<button>` elements, to build a tab group:

```html
<ce-tab-group>
  <ce-tab-list>
    <button type="button">Tab 1</button>
    <button type="button">Tab 2</button>
    <button type="button">Tab 3</button>
  </ce-tab-list>
  <ce-tab-panels>
    <div>Content 1</div>
    <div hidden>Content 2</div>
    <div hidden>Content 3</div>
  </ce-tab-panels>
</ce-tab-group>
```

#### Setting the active tab

The initially active tab is determined by the absence of the `hidden` attribute on panels. This allows the component to work correctly with server-side rendering.

```html
<ce-tab-panels>
  <div>Active panel</div>
  <div hidden>Inactive panel</div>
  <div hidden>Inactive panel</div>
</ce-tab-panels>
```