import { Popup } from "./popup";

describe('show', () => {
    it('should show the dialog', () => {
        let popup = new Popup();

        popup.show({ x: 0, y: 0 }, "test");

        let summaryPane: HTMLElement = popup.el;

        expect(summaryPane.style.display).toBe('initial');
    });

    it('should show the dialog on the opposite side of the screen from the mouse', () => {
        let popup = new Popup();

        popup.show({ x: 0, y: 0 }, "test");

        let summaryPane: HTMLElement = popup.el;

        expect(summaryPane.style.left.slice(0, -2)).toBeGreaterThan(window.innerWidth / 2);

        popup.show({ x: window.innerWidth, y: 0 }, "test");

        expect(summaryPane.style.left.slice(0, -2)).toBeLessThan(window.innerWidth / 2);
    });

    it('should accept either text or a Promise', (done) => {
        let popup = new Popup();

        popup.show({ x: 0, y: 0 }, "test");

        let summaryPane: HTMLElement = popup.el;

        expect(summaryPane.textContent).toBe('test');

        expect(() => { popup.show({ x: 0, y: 0 }, <any>1) }).toThrow();

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            resolve("test promise");
        }));

        setTimeout(() => {
            expect(summaryPane.textContent).toBe('test promise');
            done();
        }, 0);
    });

    it('should show a loader if a promise is passed', (done) => {
        let popup = new Popup();

        let summaryPane: HTMLElement = popup.el;

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("test promise");
            }, 10);
        }));

        expect(summaryPane.querySelector('.lds-dual-ring')).toBeTruthy();

        setTimeout(() => {
            expect(summaryPane.textContent).toBe('test promise');
            expect(summaryPane.querySelector('.lds-dual-ring')).toBeFalsy();
            done();
        }, 11);
    });

    it('should only show the latest promise, even if returned in a different order', (done) => {
        let popup = new Popup();

        let summaryPane: HTMLElement = popup.el;

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("test promise 1");
            }, 10);
        }));

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("test promise 3");
            }, 2);
        }));

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("test promise 2");
            }, 1);
        }));

        setTimeout(() => {
            expect(summaryPane.textContent).toBe('test promise 2');
            done();
        }, 16);
    })

    it('should not show promises after text', (done) => {
        let popup = new Popup();

        let summaryPane: HTMLElement = popup.el;

        popup.show({ x: 0, y: 0 }, new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("test promise 1");
            }, 2);
        }));

        popup.show({ x: 0, y: 0 }, "Not a promise");

        setTimeout(() => {
            expect(summaryPane.textContent).toBe("Not a promise");
            done();
        }, 5);
    })
})