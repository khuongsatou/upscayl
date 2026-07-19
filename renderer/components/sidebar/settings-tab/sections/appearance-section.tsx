import React from "react";
import SelectTheme from "../select-theme";
import LanguageSwitcher from "../language-switcher";

function AppearanceSection() {
  return (
    <div className="flex flex-col gap-5">
      <SelectTheme />
      <LanguageSwitcher />
    </div>
  );
}

export default AppearanceSection;
