import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FiltersPanel } from "@/components/filters-panel";
import type { Filters } from "@/lib/types";

const filters: Filters = {
  date: "2026-09-24",
  areas: ["渋谷区"],
  format: "all",
  keyword: "",
};

function Panel({ onKeyword }: { onKeyword: (keyword: string) => void }) {
  const [keywordResetKey, setKeywordResetKey] = useState(0);

  return (
    <FiltersPanel
      keywordResetKey={keywordResetKey}
      filters={filters}
      groups={{ wards: ["渋谷区"], cities: [], prefectures: [], other: [] }}
      counts={new Map([["渋谷区", 1]])}
      onFormat={vi.fn()}
      onAreas={vi.fn()}
      onKeyword={onKeyword}
      onClear={() => setKeywordResetKey((key) => key + 1)}
    />
  );
}

describe("FiltersPanel", () => {
  it("条件をクリアすると未確定のキーワードを送らない", async () => {
    const user = userEvent.setup({ delay: null });
    const onKeyword = vi.fn();

    render(<Panel onKeyword={onKeyword} />);
    await user.type(screen.getByRole("searchbox", { name: "キーワード" }), "React");
    await user.click(screen.getByRole("button", { name: "条件をクリア" }));
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(onKeyword).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox", { name: "キーワード" })).toHaveValue("");
  });

  it("神奈川県・埼玉県・千葉県を県として選べる", async () => {
    const user = userEvent.setup({ delay: null });
    const onAreas = vi.fn();

    render(
      <FiltersPanel
        keywordResetKey={0}
        filters={{ ...filters, areas: [] }}
        groups={{
          wards: ["渋谷区"],
          cities: [],
          prefectures: ["神奈川県", "埼玉県", "千葉県"],
          other: [],
        }}
        counts={
          new Map([
            ["渋谷区", 1],
            ["千葉県", 2],
          ])
        }
        onFormat={vi.fn()}
        onAreas={onAreas}
        onKeyword={vi.fn()}
        onClear={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "エリアを選択：すべて" }));
    const prefectures = screen.getByRole("group", { name: "県" });
    expect(within(prefectures).getByRole("button", { name: "神奈川県（0）" })).toBeInTheDocument();
    expect(within(prefectures).getByRole("button", { name: "埼玉県（0）" })).toBeInTheDocument();
    expect(within(prefectures).getByRole("button", { name: "千葉県（2）" })).toBeInTheDocument();

    await user.click(within(prefectures).getByRole("button", { name: "千葉県（2）" }));
    expect(onAreas).toHaveBeenLastCalledWith(["千葉県"]);

    await user.click(screen.getByRole("checkbox", { name: /^埼玉県/ }));
    expect(onAreas).toHaveBeenLastCalledWith(["埼玉県"]);
  });

  it("PC のエリアはチェックボックスで複数選べ、もう一度押すと外れ、すべてで全解除する", async () => {
    const user = userEvent.setup({ delay: null });
    const onAreas = vi.fn();
    render(<AreaPanel onAreas={onAreas} />);

    const all = screen.getByRole("checkbox", { name: "すべて" });
    expect(all).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: /^北区/ }));
    await user.click(screen.getByRole("checkbox", { name: /^港区/ }));
    await user.click(screen.getByRole("checkbox", { name: /^神奈川県/ }));
    expect(onAreas).toHaveBeenLastCalledWith(["北区", "港区", "神奈川県"]);
    expect(screen.getByRole("checkbox", { name: /^北区/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^港区/ })).toBeChecked();
    expect(all).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: /^北区/ }));
    expect(onAreas).toHaveBeenLastCalledWith(["港区", "神奈川県"]);
    expect(screen.getByRole("checkbox", { name: /^北区/ })).not.toBeChecked();

    await user.click(all);
    expect(onAreas).toHaveBeenLastCalledWith([]);
    expect(all).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^港区/ })).not.toBeChecked();

    const calls = onAreas.mock.calls.length;
    await user.click(all);
    expect(onAreas).toHaveBeenCalledTimes(calls);
  });

  it("スマホのエリアは開閉式のトグルで複数選べ、もう一度押すと外れ、すべてで全解除する", async () => {
    const user = userEvent.setup({ delay: null });
    const onAreas = vi.fn();
    render(<AreaPanel onAreas={onAreas} />);

    const disclosure = screen.getByRole("button", { name: "エリアを選択：すべて" });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "23区" })).not.toBeInTheDocument();

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    const wards = screen.getByRole("group", { name: "23区" });

    await user.click(within(wards).getByRole("button", { name: "北区（3）" }));
    await user.click(within(wards).getByRole("button", { name: "港区（1）" }));
    expect(onAreas).toHaveBeenLastCalledWith(["北区", "港区"]);
    expect(within(wards).getByRole("button", { name: "北区（3）" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "エリアを選択：北区、港区" })).toBe(disclosure);

    await user.click(
      within(screen.getByRole("group", { name: "県" })).getByRole("button", { name: "千葉県（0）" })
    );
    expect(disclosure).toHaveAccessibleName("エリアを選択：北区 ほか2件");

    await user.click(within(wards).getByRole("button", { name: "北区（3）" }));
    expect(onAreas).toHaveBeenLastCalledWith(["港区", "千葉県"]);
    expect(within(wards).getByRole("button", { name: "北区（3）" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    const allChip = screen.getByRole("button", { name: "すべて", pressed: false });
    await user.click(allChip);
    expect(onAreas).toHaveBeenLastCalledWith([]);
    expect(allChip).toHaveAttribute("aria-pressed", "true");
    expect(disclosure).toHaveAccessibleName("エリアを選択：すべて");

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
  });
});

function AreaPanel({ onAreas }: { onAreas: (areas: string[]) => void }) {
  const [areas, setAreas] = useState<string[]>([]);

  return (
    <FiltersPanel
      keywordResetKey={0}
      filters={{ ...filters, areas }}
      groups={{
        wards: ["港区", "北区"],
        cities: [],
        prefectures: ["神奈川県", "埼玉県", "千葉県"],
        other: [],
      }}
      counts={
        new Map([
          ["港区", 1],
          ["北区", 3],
        ])
      }
      onFormat={vi.fn()}
      onAreas={(next) => {
        onAreas(next);
        setAreas(next);
      }}
      onKeyword={vi.fn()}
      onClear={vi.fn()}
    />
  );
}
