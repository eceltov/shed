if (typeof roles === 'undefined') {
    // Export for browsers
    var roles = {};
}

roles.none = 0;
roles.viewer = 1;
roles.editor = 2;
roles.admin = 3;
roles.owner = 4;

/**
 * @param {*} role The role to be stringified.
 * @returns Returns the string representation of a role.
 */
roles.getRoleName = function(role) {
    let roleName;
    switch(role) {
        case roles.none:
            roleName = "None";
            break;
        case roles.viewer:
            roleName = "Viewer";
            break;
        case roles.editor:
            roleName = "Editor";
            break;
        case roles.admin:
            roleName = "Admin";
            break;
        case roles.owner:
            roleName = "Owner";
            break;
        default:
            roleName = "Undefined";
    }
    return roleName;
}

/**
 * @param {*} role The role of some entity.
 * @returns Returns true if the role can edit documents, else returns false. 
 */
roles.canEdit = function(role) {
    return (role === roles.editor) || (role === roles.admin) || (role === roles.owner);
}


module.exports = roles;
