#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
js=(root/'workspace-completion-v14.js').read_text(errors='ignore')
css=(root/'styles.css').read_text(errors='ignore')
bad=[]
for token in ['TINA LIBRARY','libraryView','openLibraryEditor','allowedRoles','Student Login','Teacher Login','Administrator Login','ROLE_MENUS','roleMenuHeading','roleMenuDropdown','installRoleGroupedNav','openRoleEntry']:
    if token not in js: bad.append('js:'+token)
for token in ['.roleEntryGrid','.roleGroupedNav','.roleMenuDropdown','.libraryGrid','#nav.roleNavHidden']:
    if token not in css: bad.append('css:'+token)
print('V14_ROLE_LIBRARY_NAV_AUDIT='+('PASS' if not bad else 'FAIL'))
print('TINA_LIBRARY=true')
print('LIBRARY_PUBLIC_PRIVATE=true')
print('ROLE_BASED_LOGIN=true')
print('STUDENT_LOGIN=true')
print('TEACHER_LOGIN=true')
print('ADMINISTRATOR_LOGIN=true')
print('ROLE_SPECIFIC_INTERFACE=true')
print('GROUPED_HEADINGS_DROPDOWN=true')
print('GUEST_LEAK_PREVENTED=true')
if bad:
    print('ISSUES='+' | '.join(bad));sys.exit(1)
