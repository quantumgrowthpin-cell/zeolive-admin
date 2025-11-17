export const isSubAdminUser = () => {
    if (typeof window !== 'undefined') {
        return JSON.parse(sessionStorage.getItem('isSubAdmin')) === true;
    }

    
return false;
};

export const getPermissions = () => {
    // ✅ Only fetch permissions for SubAdmin
    if (!isSubAdminUser()) return [];

    const subAdminData = sessionStorage.getItem('subadmin');

    if (!subAdminData) return [];

    const { permissions } = JSON.parse(subAdminData);

    
return permissions || [];
}

export const canViewModule = (sectionName) => {
    if (!isSubAdminUser()) return true;

    const perms = getPermissions()
    const section = perms?.find(p => p.section === sectionName);

    
return section?.canView === true;
}

export const canEditModule = (sectionName) => {
    if (!isSubAdminUser()) return true;

    const perms = getPermissions();
    const section = perms?.find(p => p.section === sectionName);

    
return section?.canEdit === true;
}

export const hasFullAccess = (sectionName) => {
    return canViewModule(sectionName) && canEditModule(sectionName)
}

export const hasVisibleItems = (sections) => {
    if (!isSubAdminUser()) return true;
    
return sections.some(sectionName => canViewModule(sectionName));
};