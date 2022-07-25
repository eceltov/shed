class Editor {
  constructor(theme) {
    this.aceEditor = null;
    this.mounted = false;
    this.aceTheme = theme;
  }

  mount() {
    this.aceEditor = ace.edit('editor');
    this.aceEditor.setTheme(this.aceTheme);
    this.aceEditor.setReadOnly(true);
    this.aceEditor.setOptions({
      fontSize: '12pt',
      printMarginColumn: 100,
    });
    this.mounted = true;
  }

  setSession(session) {
    this.aceEditor.setSession(session);
  }

  setReadOnly(readOnly) {
    this.aceEditor.setReadOnly(readOnly);
  }

  getCursorPosition() {
    return this.aceEditor.getCursorPosition();
  }
}

module.exports = Editor;
