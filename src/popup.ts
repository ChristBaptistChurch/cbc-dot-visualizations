export class Popup {
    // We need to keep traick
    promiseCount: number = 0;
    el: HTMLElement;

    body: HTMLElement;

    toolbar: HTMLElement;
    closeButton: HTMLElement;
    openButton: HTMLElement;

    pinned: boolean = false;

    entity: any;

    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'summary-pane';

        this.body = document.createElement('div');

        this.toolbar = document.createElement('div');
        this.toolbar.style.cssFloat = "right";
        this.toolbar.style.display = 'none';
        this.toolbar.style.width = "100%";
        this.toolbar.style.justifyContent = 'flex-end';

        this.closeButton = document.createElement('div');
        this.closeButton.innerHTML = "<i class='fa fa-times-circle'></i>";
        this.closeButton.style.cursor = "pointer";
        this.closeButton.onclick = this.unpin.bind(this);

        this.openButton = document.createElement('div');
        this.openButton.innerHTML = "<i class='fa fa-external-link-alt'></i>";
        this.openButton.style.cursor = "pointer";
        this.openButton.style.marginRight = '10px';
        this.openButton.onclick = this.open.bind(this);

        this.toolbar.append(this.openButton);
        this.toolbar.append(this.closeButton);

        this.el.append(this.toolbar);
        this.el.append(this.body);
    }

    calculatePosition(mousePosition: { x: number, y: number }) {
        let popupX = 0;
        let popupY = 0;

        let currentBox = this.el.getBoundingClientRect();

        if ( currentBox.width > (window.innerWidth / 2) ) {
            popupX = 0;
        } else {
            if (mousePosition.x > (window.innerWidth / 2)) {
                popupX = window.innerWidth / 4 - (currentBox.width / 2);
            } else {
                popupX = window.innerWidth / 4 * 3 - (currentBox.width / 2);
            }
        }

        if (currentBox.height > window.innerHeight) {
            popupY = 0;
        } else {
            popupY = (window.innerHeight / 2) - (currentBox.height / 2);
        }

        this.el.style.left = popupX + "px";
        // this.el.style.top = popupY + "px";
    }

    preview(mousePosition: { x: number, y: number }, content: Promise<string> | string, entity: any = null) {
        if (!this.pinned) {
            this.show(mousePosition, content, entity);
        }
    }

    show(mousePosition: { x: number, y: number }, content: Promise<string> | string, entity: any = null) {
        this.entity = entity;
        this.el.style.display = 'initial';

        if (typeof content === 'string') {
            this.body.innerHTML = content;
            this.promiseCount++;
            this.calculatePosition(mousePosition);
        } else if (content && typeof content.then === 'function') {
            // Show loader
            this.body.innerHTML = '<div class="lds-dual-ring"></div>';
            this.calculatePosition(mousePosition);

            this.promiseCount++;
            const promiseCountAtTimeOfDispatch = this.promiseCount;
            content.then((value) => {
                // If this is not true, it's because showPopupDialog has
                // been called again before this promise returned, so don't
                // show the wrong content
                if (this.promiseCount == promiseCountAtTimeOfDispatch) {
                    this.body.innerHTML = value;
                    this.promiseCount = 0;

                    this.calculatePosition(mousePosition);
                }
            });
        } else {
            throw "Not a string or promise";
        }
    }

    hide() {
        if (!this.pinned) {
            this.el.style.display = 'none';
        }
    }

    pin() {
        if (this.entity) {
            this.openButton.style.display = 'initial';
        } else {
            this.openButton.style.display = 'none';
        }

        this.pinned = true;
        this.toolbar.style.display = 'flex';
    }

    unpin() {
        this.pinned = false;
        this.toolbar.style.display = 'none';
        this.el.style.display = 'none';
    }

    open() {
        this.el.dispatchEvent(new CustomEvent("OpenClicked", {
            detail: this.entity,
            bubbles: false,
            cancelable: true
        }));
    }
}