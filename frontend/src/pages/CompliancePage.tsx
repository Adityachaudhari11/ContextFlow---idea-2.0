import { useState, useEffect } from 'react'
import { Shield, Mail, Trash2, AlertTriangle, Info, Crown, Plus, Search } from 'lucide-react'
import { compliance, customers } from '../services/api'
import type { DNCEntry, Customer } from '../types'

export default function CompliancePage() {
  const [dncList, setDncList] = useState<DNCEntry[]>([])
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  // VIP State
  const [priorityCustomers, setPriorityCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [custSearch, setCustSearch] = useState('')
  const [custResults, setCustResults] = useState<Customer[]>([])

  useEffect(() => {
    compliance.dncList().then(setDncList)
    loadVIPs()
  }, [])

  const loadVIPs = async () => {
    setLoadingCustomers(true)
    try {
      const data = await customers.list({ priority: true })
      setPriorityCustomers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const add = async () => {
    const val = email.trim().toLowerCase()
    if (!val || !val.includes('@')) { setError('Enter a valid email address'); return }
    setError('')
    setAdding(true)
    try {
      const entry = await compliance.addDnc(val)
      setDncList((prev) => [entry, ...prev])
      setEmail('')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to add entry')
    } finally {
      setAdding(false)
    }
  }

  const remove = async (id: string) => {
    await compliance.removeDnc(id)
    setDncList((prev) => prev.filter((d) => d.id !== id))
  }

  const handleCustSearch = async (val: string) => {
    setCustSearch(val)
    if (!val.trim()) {
      setCustResults([])
      return
    }
    try {
      const results = await customers.list({ search: val })
      // Filter out those who are already VIP
      const filtered = results.filter(
        (r) => !priorityCustomers.some((pc) => pc.id === r.id)
      )
      setCustResults(filtered)
    } catch (e) {
      console.error(e)
    }
  }

  const addVIP = async (cust: Customer) => {
    try {
      await customers.togglePriority(cust.id)
      setPriorityCustomers((prev) => [...prev, { ...cust, is_priority: true }])
      setCustSearch('')
      setCustResults([])
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCustomerPriority = async (cust: Customer) => {
    try {
      await customers.togglePriority(cust.id)
      setPriorityCustomers((prev) => prev.filter((c) => c.id !== cust.id))
    } catch (e) {
      console.error(e)
    }
  }

  const emailEntries = dncList.filter((d) => d.identifier_type === 'email')

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <h1 className="text-lg font-semibold text-gray-900">Compliance & Customer Settings</h1>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Manage communication restrictions (DNC) and customer preference mappings (VIPs).</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* How it works info box */}
        <div className="flex gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4">
          <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-teal-700 space-y-1">
            <p className="font-medium">Policy Configurations</p>
            <p><strong>DNC List:</strong> Stops all marketing broadcasts and automated workflows. Active compliance blocks all channels immediately upon entry.</p>
            <p><strong>VIP / Priority Users:</strong> Flags chosen clients with premium styling. Alerts agents in the Inbox for rapid priority routing.</p>
          </div>
        </div>

        {/* Two-Column split container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Compliance / DNC */}
          <div className="space-y-4">
            
            {/* Add to DNC */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400" />
                Add Email to DNC List
              </h3>
              <div className="flex gap-2">
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="customer@example.com"
                  type="email"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
                <button
                  onClick={add}
                  disabled={adding}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {adding ? 'Addingâ€¦' : 'Block Email'}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{error}
                </p>
              )}
            </div>

            {/* Blocked emails list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Blocked DNC List</p>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {emailEntries.length} blocked
                </span>
              </div>
              {emailEntries.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No emails blocked</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {emailEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{entry.identifier}</p>
                          <p className="text-xs text-gray-400 truncate">{entry.customer_name || "Unknown customer"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <button
                          onClick={() => remove(entry.id)}
                          title="Remove from DNC"
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Right Column: Privileged Customers */}
          <div className="space-y-4">
            
            {/* Search and Add to VIP */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative z-10">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                Configure Customer VIP Privilege
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={custSearch}
                  onChange={(e) => handleCustSearch(e.target.value)}
                  placeholder="Search customer by name or emailâ€¦"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                />
                
                {custResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {custResults.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{r.display_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{r.email || r.phone}</p>
                        </div>
                        <button
                          onClick={() => addVIP(r)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Make VIP
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privileged/VIP Customers list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <p className="text-sm font-semibold text-gray-700">Privileged Customers</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  {priorityCustomers.length} active VIP
                </span>
              </div>

              {loadingCustomers ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading VIP listâ€¦</div>
              ) : priorityCustomers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No customers currently flagged as VIP</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {priorityCustomers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.display_name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email || c.phone || 'No contact details'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCustomerPriority(c)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      >
                        Remove VIP
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
