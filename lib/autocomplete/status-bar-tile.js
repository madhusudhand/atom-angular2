// 'use strict';

class IndexProgressView extends HTMLElement {
  init() {
    this.classList.add('inline-block', 'index-progress-view');
    return this;
  }

  showProgress() {
    this.innerHTML = this.getSpinner() + '<span class="in-progress">Indexing</span>';
    this.classList.add('in-progress');
    return this;
  }

  showComplete() {
    this.innerHTML = '<span class="icon-check complete">Indexed</span>';
    return this;
  }

  showError() {
    this.innerHTML = '<span class="icon-x error">Error</span>';
    return this;
  }

  hide() {
    this.style.display = 'none';
    return this;
  }


  getSpinner() {
    return `<div class="icon spinner inline-block"></div>`;
  }
}


module.exports = document.registerElement('angular2-index-status', {
  prototype: IndexProgressView.prototype,
  extends: 'div'
});
