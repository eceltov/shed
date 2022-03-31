const roles = {
  none: 0,
  viewer: 1,
  editor: 2, // cannot create/delete/rename files
  workspaceEditor: 3, // can create/delete/rename files
  admin: 4,
  owner: 5,
};

/**
 * @param {*} role The role to be stringified.
 * @returns Returns the string representation of a role.
 */
function getRoleName(role) {
  let roleName;
  switch (role) {
    case roles.none:
      roleName = 'None';
      break;
    case roles.viewer:
      roleName = 'Viewer';
      break;
    case roles.editor:
      roleName = 'Editor';
      break;
    case roles.workspaceEditor:
      roleName = 'Workspace Editor';
      break;
    case roles.admin:
      roleName = 'Admin';
      break;
    case roles.owner:
      roleName = 'Owner';
      break;
    default:
      roleName = `UndefinedRole: ${role}`;
  }
  return roleName;
}

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can view documents, else returns false.
 */
function canView(role) {
  return (role === roles.viewer)
    || (role === roles.editor)
    || (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
}

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can edit documents, else returns false.
 */
function canEdit(role) {
  return (role === roles.editor)
    || (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
}

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can create/delete/rename files, else returns false.
 */
function canManageFiles(role) {
  return (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
}

module.exports = {
  roles, getRoleName, canView, canEdit, canManageFiles,
};
