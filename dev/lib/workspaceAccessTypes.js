const accessTypes = {
  // only those with access can view and edit the workspace
  privileged: 0,
  // only those with access can view the workspace
  ///TODO: not implemented
  privilegedReadOnly: 1,
  // all can view and edit the workspace
  ///TODO: not implemented
  all: 2,
  // all can view the workspace
  allReadOnly: 3,
};

module.exports = {
  accessTypes,
};
