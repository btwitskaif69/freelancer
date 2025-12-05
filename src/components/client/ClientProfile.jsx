"use client";

import React from "react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const ClientProfileContent = () => {
    const { user } = useAuth();
    
  return (
    <div className="space-y-10 p-6 w-full">
      <ClientTopBar />
      
      <div className="max-w-4xl space-y-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Full Name</Label>
                        <Input id="firstName" defaultValue={user?.fullName || user?.name || ""} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue={user?.email || ""} disabled />
                    </div>
                </div>
                <div className="pt-4">
                    <Button>Save Changes</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ClientProfile = () => {
  return (
    <RoleAwareSidebar>
      <ClientProfileContent />
    </RoleAwareSidebar>
  );
};

export default ClientProfile;
