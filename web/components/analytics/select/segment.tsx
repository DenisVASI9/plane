import { useRouter } from "next/router";
import {useTranslation} from 'next-i18next';
// ui
import { CustomSelect } from "components/ui";
// types
import { IAnalyticsParams, TXAxisValues } from "types";
// constants
import { ANALYTICS_X_AXIS_VALUES } from "constants/analytics";

type Props = {
  value: TXAxisValues | null | undefined;
  onChange: () => void;
  params: IAnalyticsParams;
};

export const SelectSegment: React.FC<Props> = ({ value, onChange, params }) => {
  const router = useRouter();
  const { cycleId, moduleId } = router.query;
    const { t } = useTranslation();
  return (
    <CustomSelect
      value={value}
      label={
        <span>
          {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label ?? (
            <span className="text-custom-text-200">{t("components.analytics.no-value")}</span>
          )}
        </span>
      }
      onChange={onChange}
      width="w-full"
      maxHeight="lg"
    >
      <CustomSelect.Option value={null}>No value</CustomSelect.Option>
      {ANALYTICS_X_AXIS_VALUES.map((item) => {
        if (params.x_axis === item.value) return null;
        if (cycleId && item.value === "issue_cycle__cycle__name") return null;
        if (moduleId && item.value === "issue_module__module__name") return null;

        return (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        );
      })}
    </CustomSelect>
  );
};
