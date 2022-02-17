const roles = {};

roles.none = 0;
roles.viewer = 1;
roles.editor = 2; // cannot create/delete/rename files
roles.workspaceEditor = 3; // can create/delete/rename files
roles.admin = 4;
roles.owner = 5;

/**
 * @param {*} role The role to be stringified.
 * @returns Returns the string representation of a role.
 */
roles.getRoleName = function getRoleName(role) {
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
};

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can view documents, else returns false.
 */
roles.canView = function canView(role) {
  return (role === roles.viewer)
    || (role === roles.editor)
    || (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
};

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can edit documents, else returns false.
 */
roles.canEdit = function canEdit(role) {
  return (role === roles.editor)
    || (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
};

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can create/delete/rename files, else returns false.
 */
roles.canManageFiles = function canManageFiles(role) {
  return (role === roles.workspaceEditor)
    || (role === roles.admin)
    || (role === roles.owner);
};

module.exports = roles;
