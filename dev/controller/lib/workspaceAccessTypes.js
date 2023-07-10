const roles = require('./roles');

const accessTypes = {
  // only those with access can view and edit the workspace
  privileged: 0,
  // only those with access can view the workspace
  ///TODO: not implemented
  privilegedReadOnly: 1,
  // all can view and edit the workspace
  all: 2,
  // all can view the workspace
  allReadOnly: 3,
};

function allowsGuests(accessType) {
  return (accessType === accessTypes.all)
    || (accessType === accessTypes.allReadOnly);
}

function canAccessWorkspace(accessType, userRole) {
  return roles.canView(userRole) || allowsGuests(accessType);
}

function canEdit(accessType, userRole) {
  return roles.canEdit(userRole) || accessType === accessTypes.all;
}

module.exports = {
  accessTypes, allowsGuests, canAccessWorkspace, canEdit,
};
