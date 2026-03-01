declare module '@cityos/design-system' {
  export type GiftCardAmountSelectorProps = Record<string, any>
  export type GiftCardBalanceProps = Record<string, any>
  export type GiftCardDesignPickerProps = Record<string, any>
  export type GiftCardMessageFormProps = Record<string, any>
  export type GiftCardRedeemProps = Record<string, any>
  export type EarnRulesListProps = Record<string, any>
  export type LoyaltyDashboardProps = Record<string, any>
  export type PointsBalanceProps = Record<string, any>
  export type PointsHistoryProps = Record<string, any>
  export type RedeemRewardFormProps = Record<string, any>
  export type RewardCardProps = Record<string, any>
  export type TierProgressProps = Record<string, any>
  export type InviteFriendFormProps = Record<string, any>
  export type ReferralCodeCardProps = Record<string, any>
  export type ReferralDashboardProps = Record<string, any>
  export type ReferralRewardProps = Record<string, any>
  export type ReferralStatsProps = Record<string, any>
  export const Button: React.ComponentType<any>
  export const Input: React.ComponentType<any>
  export const Card: React.ComponentType<any>
  export const Badge: React.ComponentType<any>
  export const Modal: React.ComponentType<any>
  export const Spinner: React.ComponentType<any>
  export const Icon: React.ComponentType<any>
  export const Text: React.ComponentType<any>
  export const Heading: React.ComponentType<any>
  export const Container: React.ComponentType<any>
  export const Flex: React.ComponentType<any>
  export const Grid: React.ComponentType<any>
  export const Box: React.ComponentType<any>
  export const Stack: React.ComponentType<any>
  export const Divider: React.ComponentType<any>
  export const Avatar: React.ComponentType<any>
  export const Tag: React.ComponentType<any>
  export const Alert: React.ComponentType<any>
  export const Tooltip: React.ComponentType<any>
  export const Select: React.ComponentType<any>
  export const Checkbox: React.ComponentType<any>
  export const Radio: React.ComponentType<any>
  export const Switch: React.ComponentType<any>
  export const Slider: React.ComponentType<any>
  export const Textarea: React.ComponentType<any>
  export const Table: React.ComponentType<any>
  export const Pagination: React.ComponentType<any>
  export const NumberInput: React.ComponentType<any>
  export const DatePicker: React.ComponentType<any>
  export const ColorPicker: React.ComponentType<any>
  export const FileUpload: React.ComponentType<any>
  export const Form: React.ComponentType<any>
  export const FormField: React.ComponentType<any>
  export const FormLabel: React.ComponentType<any>
  export const FormError: React.ComponentType<any>
  export const Drawer: React.ComponentType<any>
  export const Popover: React.ComponentType<any>
  export const Menu: React.ComponentType<any>
  export const Tabs: React.ComponentType<any>
  export const Accordion: React.ComponentType<any>
  export const Progress: React.ComponentType<any>
  export const Skeleton: React.ComponentType<any>
  export const Kbd: React.ComponentType<any>
  export const Code: React.ComponentType<any>
  export const Link: React.ComponentType<any>
  export const Image: React.ComponentType<any>
  export const Chart: React.ComponentType<any>
  export const useToast: () => any
  export const toast: any
  export const defaultExport: any
}

declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, config?: Record<string, any>) => string
    addHook: (hook: string, callback: (node: Element) => void) => void
    isValidAttribute: (tag: string, attr: string, value: string) => boolean
  }
  export default DOMPurify
}