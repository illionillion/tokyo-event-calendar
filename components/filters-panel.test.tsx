import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FiltersPanel } from "@/components/filters-panel";
import type { Filters } from "@/lib/types";

const filters: Filters = {
  date: "2026-09-24",
  area: "渋谷区",
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
      onArea={vi.fn()}
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
    const onArea = vi.fn();

    render(
      <FiltersPanel
        keywordResetKey={0}
        filters={{ ...filters, area: null }}
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
        onArea={onArea}
        onKeyword={vi.fn()}
        onClear={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox", { name: "エリアを選択" });
    expect(screen.getByRole("group", { name: "県" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "神奈川県（0）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "埼玉県（0）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "千葉県（2）" })).toBeInTheDocument();

    await user.selectOptions(select, "千葉県");
    expect(onArea).toHaveBeenLastCalledWith("千葉県");

    await user.click(screen.getByRole("radio", { name: /^埼玉県/ }));
    expect(onArea).toHaveBeenLastCalledWith("埼玉県");
  });
});
