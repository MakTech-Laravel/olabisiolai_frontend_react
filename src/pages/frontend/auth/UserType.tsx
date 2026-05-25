import { Briefcase, User } from "lucide-react";
import { Link } from "react-router-dom";
import { saveAuthRole } from "@/features/auth/roleSelection";
import { type AuthRole } from "@/features/auth/types";

export default function UserType() {
  function onSelectRole(role: AuthRole) {
    saveAuthRole(role);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-auth-bg p-4">
      <div className="max-w-md w-full ">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-cente w-20 h-20 ">
           <img src="logo.png" alt="" className="rounded-3xl w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 font-inter">
            Join GIDIRA
          </h1>
          <p className="text-muted-foreground text-base font-inter">
            Choose your account type
          </p>
        </div>

        {/* User Type Options */}
        <div className="space-y-4">
          {/* Customer Option */}
          <Link
            to="/login/email?role=user"
            className="block"
            onClick={() => onSelectRole("user")}
          >
            <div className="bg-card rounded-xl p-3 sm:p-6 border border-border cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-avatar-a rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-popover " />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium font-inter text-ink-heading">
                      I'm a Customer
                    </h3>
                    <p className="text-sm font-inter font-medium text-text-secondary">
                      Find and connect with businesses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Business Owner Option */}
          <Link
            to="/login/email?role=vendor"
            className="block"
            onClick={() => onSelectRole("vendor")}
          >
            <div className="bg-card rounded-xl p-3 sm:p-6 border border-border cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F4B400] rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-popover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium font-inter text-ink-heading">
                      I'm a Vendor
                    </h3>
                    <p className="text-sm font-inter font-medium text-text-secondary">
                      Grow your business and reach more customers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
