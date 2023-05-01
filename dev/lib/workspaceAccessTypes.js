const accessTypes = {
  // only those with access can view and edit the workspace
  priviledged: 0,
  // only those with access can view the workspace
  ///TODO: not implemented
  priviledgedReadOnly: 1,
  // all can view and edit the workspace
  ///TODO: not implemented
  all: 2,
  // all can view the workspace
  allReadOnly: 3,
};

module.exports = {
  accessTypes,
};
