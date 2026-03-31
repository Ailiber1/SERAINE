"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Check } from "lucide-react";

interface ShippingSettings {
  fee: number;
  free_threshold: number;
}

export default function AdminSettings() {
  const [shipping, setShipping] = useState<ShippingSettings>({
    fee: 550,
    free_threshold: 10000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb
      .from("site_settings")
      .select("key, value")
      .eq("key", "shipping")
      .single();

    if (data?.value) {
      const val = data.value as unknown as ShippingSettings;
      setShipping({
        fee: val.fee ?? 550,
        free_threshold: val.free_threshold ?? 10000,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // upsert: keyがshippingの行を更新、なければ挿入
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          key: "shipping",
          value: {
            fee: shipping.fee,
            free_threshold: shipping.free_threshold,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      alert("保存に失敗しました: " + error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
          設定
        </h1>
        <div className="p-8 text-center text-[13px] text-deep-charcoal/40">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl md:text-3xl tracking-wide mb-6">
        設定
      </h1>

      {/* 送料設定 */}
      <div className="bg-white rounded-lg border border-border-light p-5 max-w-[480px]">
        <h2 className="text-[15px] font-medium mb-4">送料設定</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-deep-charcoal/60 mb-1">
              送料（円）
            </label>
            <input
              type="number"
              value={shipping.fee}
              onChange={(e) =>
                setShipping({ ...shipping, fee: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold font-price"
            />
          </div>

          <div>
            <label className="block text-[12px] text-deep-charcoal/60 mb-1">
              送料無料の注文金額（円以上）
            </label>
            <input
              type="number"
              value={shipping.free_threshold}
              onChange={(e) =>
                setShipping({
                  ...shipping,
                  free_threshold: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full px-3 py-2 text-[13px] border border-border-light rounded-md focus:outline-none focus:border-champagne-gold font-price"
            />
            <p className="text-[11px] text-deep-charcoal/40 mt-1">
              この金額以上の注文は送料無料になります
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-deep-charcoal text-white px-5 py-2 text-[13px] rounded-md hover:bg-deep-charcoal/90 transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={16} />
                保存しました
              </>
            ) : (
              <>
                <Save size={16} />
                {saving ? "保存中..." : "保存"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 通知設定 */}
      <div className="bg-white rounded-lg border border-border-light p-5 max-w-[480px] mt-6">
        <h2 className="text-[15px] font-medium mb-4">通知設定</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="accent-champagne-gold"
            />
            新規注文時にメール通知を受け取る
          </label>
          <label className="flex items-center gap-3 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="accent-champagne-gold"
            />
            在庫が10個以下になったらメール通知を受け取る
          </label>
        </div>
        <p className="text-[11px] text-deep-charcoal/40 mt-3">
          ※ メール通知はResend連携後に有効になります
        </p>
      </div>
    </div>
  );
}
