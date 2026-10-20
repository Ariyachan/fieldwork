import { createContext, useContext } from 'react'

export type AccountUser = { id: string; name: string; email: string }
type Account = { user: AccountUser; signOut: () => Promise<void> }
export const AccountContext = createContext<Account | null>(null)
export const useAccount = () => useContext(AccountContext)
