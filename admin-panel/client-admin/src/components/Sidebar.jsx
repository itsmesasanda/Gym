import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',               label: 'Dashboard'     },
  { to: '/users',          label: 'Users'         },
  { to: '/meals',          label: 'Meals'         },
  { to: '/announcements',  label: 'Announcements' },
  { to: '/events',         label: 'Events'        },
  { to: '/videos',         label: 'Videos'        },
  { to: '/payments',       label: 'Payments'      },
  { to: '/reports',        label: 'Reports'       },
  { to: '/admins',         label: 'Manage Admins' },
];

const Sidebar = () => (
  <aside className="admin-sidebar">
    <ul className="admin-sidebar-list">
      {links.map(({ to, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  </aside>
);

export default Sidebar;
