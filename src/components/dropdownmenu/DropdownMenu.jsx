import { useState, useRef, useEffect } from "react";
import "./dropdownMenu.scss";

export default function DropdownMenu({ options }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={menuRef}>
      <button className="dropdown-toggle" onClick={() => setOpen(!open)}>
        ⋮
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className="dropdown-item"
              onClick={() => {
                opt.onClick();
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
