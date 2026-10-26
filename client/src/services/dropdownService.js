import { useEffect, useState, useCallback } from "react";
import api from "./api";

// Hook to load and manage editable dropdown options for a specific category
export function useDropdown(vertical, category) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employee/dropdowns?vertical=${vertical}&category=${category}`);
      let data = res.data?.data || [];
      if (data.length === 0) {
        // Auto-seed defaults for the organization on first use
        await api.post("/employee/dropdowns/seed").catch(() => {});
        const retry = await api.get(`/employee/dropdowns?vertical=${vertical}&category=${category}`).catch(() => ({ data: { data: [] } }));
        data = retry.data?.data || [];
      }
      setOptions(data);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [vertical, category]);

  useEffect(() => { load(); }, [load]);

  const addOption = async (value) => {
    try {
      const res = await api.post("/employee/dropdowns", { vertical, category, value });
      setOptions((prev) => [...prev, res.data.data]);
      return res.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to add option");
    }
  };

  const renameOption = async (id, value) => {
    try {
      const res = await api.put(`/employee/dropdowns/${id}`, { value });
      setOptions((prev) => prev.map((o) => (o.id === id ? res.data.data : o)));
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to rename option");
    }
  };

  const deactivateOption = async (id) => {
    try {
      await api.delete(`/employee/dropdowns/${id}`);
      setOptions((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to remove option");
    }
  };

  return { options, loading, addOption, renameOption, deactivateOption, reload: load };
}

// Seed defaults once per session (called on app load)
export async function seedDropdownDefaults() {
  try {
    await api.post("/employee/dropdowns/seed");
  } catch {
    // silent — seeds are idempotent
  }
}
