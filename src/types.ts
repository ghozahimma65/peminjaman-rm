import React from "react";

export type User = {
  username: string;
  name: string;
  role: string;
};

export type LoginLog = {
  username: string;
  role: string;
  time: string;
  status: string;
};

export type SubMenuItem = {
  id: string;
  label: string;
};

export type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType;
  adminOnly?: boolean;
  subItems?: SubMenuItem[];
};
