import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Eye, EyeOff, Lock, Globe, AlertTriangle, Info, User } from 'lucide-react';

/**
 * SecuritySimulator.tsx
 * 
 * PURPOSE: Demonstrate Snowflake's enterprise security features for data governance
 * 
 * SNOWFLAKE CONCEPTS VISUALIZED:
 * 1. Dynamic Data Masking - Column-level masking policies applied at query result time
 * 2. Row Access Policies - Implicit WHERE clause injection based on user role
 * 
 * CRITICAL PRODUCTION CONCEPTS:
 * - Storage is unchanged - policies only affect query results
 * - Policies are defined centrally and reusable across tables
 * - Users are unaware of masked/filtered data (security through obscurity)
 * 
 * COMPLIANCE USE CASES:
 * - GDPR: Mask PII for non-privileged users
 * - Multi-tenancy: Isolate customer data by region/tenant
 * - HIPAA: Restrict access to patient records based on department
 */

type TabType = 'masking' | 'rowpolicy';
type UserRole = 'ADMIN' | 'ANALYST' | 'EXTERNAL';
type Region = 'US' | 'EU' | 'APAC';

interface CustomerRecord {
    id: number;
    name: string;
    email: string;
    ssn: string;
    creditCard: string;
    region: Region;
    revenue: number;
}

interface DataPoint {
    id: number;
    region: Region;
    value: number;
    lat: number;
    lng: number;
}

const SecuritySimulator = ({ onBack }: { onBack: () => void }) => {
    // State Management
    const [activeTab, setActiveTab] = useState<TabType>('masking');
    const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
    const [selectedRegion, setSelectedRegion] = useState<Region>('US');
    const [showMaskAnimation, setShowMaskAnimation] = useState(false);

    // Sample Data - Sensitive Customer Records
    // SNOWFLAKE CONCEPT: This represents the actual data in the table (unmasked, uncensored)
    const customerData: CustomerRecord[] = [
        { id: 1, name: 'Sarah Johnson', email: 'sarah.j@company.com', ssn: '123-45-6789', creditCard: '4532-1111-2222-3333', region: 'US', revenue: 25000 },
        { id: 2, name: 'Michael Chen', email: 'm.chen@enterprise.eu', ssn: '987-65-4321', creditCard: '5500-4444-5555-6666', region: 'EU', revenue: 42000 },
        { id: 3, name: 'Priya Patel', email: 'priya.p@tech.in', ssn: '456-78-9123', creditCard: '3782-7777-8888-9999', region: 'APAC', revenue: 38000 },
        { id: 4, name: 'James Smith', email: 'j.smith@corp.com', ssn: '321-54-7890', creditCard: '6011-1111-2222-3333', region: 'US', revenue: 31000 }
    ];

    // Geographic Data Points for Row-Level Policy Demo
    const geoData: DataPoint[] = [
        { id: 1, region: 'US', value: 150, lat: 40, lng: -100 },
        { id: 2, region: 'US', value: 200, lat: 35, lng: -110 },
        { id: 3, region: 'EU', value: 180, lat: 50, lng: 10 },
        { id: 4, region: 'EU', value: 220, lat: 45, lng: 5 },
        { id: 5, region: 'APAC', value: 190, lat: 20, lng: 100 },
        { id: 6, region: 'APAC', value: 210, lat: 25, lng: 110 }
    ];

    // MASKING POLICY LOGIC
    // SNOWFLAKE SQL EQUIVALENT:
    // CREATE MASKING POLICY email_mask AS (val string) RETURNS string ->
    //   CASE
    //     WHEN CURRENT_ROLE() IN ('ADMIN') THEN val
    //     ELSE REGEXP_REPLACE(val, '.+@', '****@')
    //   END;
    const applyMaskingPolicy = (value: string, field: string): string => {
        if (selectedRole === 'ADMIN') {
            return value; // Admins see everything
        } else if (selectedRole === 'ANALYST') {
            // Partial masking
            if (field === 'email') {
                return value.replace(/^.+@/, '****@');
            } else if (field === 'ssn') {
                return '***-**-' + value.slice(-4);
            } else if (field === 'creditCard') {
                return '****-****-****-' + value.slice(-4);
            }
        } else {
            // EXTERNAL users see fully masked
            return '*'.repeat(value.length);
        }
        return value;
    };

    // ROW ACCESS POLICY LOGIC
    // SNOWFLAKE SQL EQUIVALENT:
    // CREATE ROW ACCESS POLICY regional_policy AS (region_col string) RETURNS boolean ->
    //   CASE
    //     WHEN CURRENT_ROLE() = 'US_MANAGER' THEN region_col = 'US'
    //     WHEN CURRENT_ROLE() = 'EU_MANAGER' THEN region_col = 'EU'
    //     ELSE TRUE  -- Admin sees all
    //   END;
    const applyRowAccessPolicy = (record: CustomerRecord | DataPoint): boolean => {
        if (selectedRole === 'ADMIN') {
            return true; // Admin sees all regions
        }
        // Analysts only see their assigned region
        return record.region === selectedRegion;
    };

    // Filtered data based on row access policy
    const visibleCustomers = customerData.filter(applyRowAccessPolicy);
    const visibleGeoData = geoData.filter(applyRowAccessPolicy);

    // Matrix-style scramble animation for masking
    const scrambleText = (text: string) => {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        return text.split('').map((_, i) => (
            <motion.span
                key={i}
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.1, delay: i * 0.02, repeat: 3 }}
            >
                {chars[Math.floor(Math.random() * chars.length)]}
            </motion.span>
        ));
    };

    // Trigger masking animation when role changes
    const handleRoleChange = (role: UserRole) => {
        setShowMaskAnimation(true);
        setTimeout(() => {
            setSelectedRole(role);
            setShowMaskAnimation(false);
        }, 500);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header - Cyber Command Aesthetic */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
                        <Shield size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                            Security & Governance Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Dynamic Masking & Row-Level Security</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                        <User size={14} className="text-slate-400" />
                        <span className="text-slate-500">Current Role:</span>
                        <span className={`font-bold px-2 py-1 rounded ${selectedRole === 'ADMIN' ? 'bg-green-500/20 text-green-400' :
                                selectedRole === 'ANALYST' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {selectedRole}
                        </span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 shrink-0">
                {[
                    { id: 'masking' as TabType, label: 'Dynamic Masking', icon: <EyeOff size={14} /> },
                    { id: 'rowpolicy' as TabType, label: 'Row Access Policy', icon: <Lock size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-pink-500'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Tab 1: Dynamic Masking */}
                    {activeTab === 'masking' && (
                        <div className="space-y-6">
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Info size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div><strong className="text-red-400">Dynamic Masking:</strong> Column-level policy applied at query result time. Storage is unchanged!</div>
                                        <div><strong className="text-red-400">Zero-Copy:</strong> No data duplication. Policy defined once, applied to all queries automatically.</div>
                                        <div><strong className="text-red-400">Performance:</strong> Negligible overhead. Masking happens in result set, not during scan.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Selector */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-400">Switch Role:</span>
                                {(['ADMIN', 'ANALYST', 'EXTERNAL'] as UserRole[]).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleChange(role)}
                                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedRole === role
                                                ? role === 'ADMIN' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' :
                                                    role === 'ANALYST' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' :
                                                        'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>

                            {/* Customer Data Grid */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-800 border-b border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                    Email
                                                    {selectedRole !== 'ADMIN' && <Lock size={12} className="text-red-400" />}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                    SSN
                                                    {selectedRole !== 'ADMIN' && <Lock size={12} className="text-red-400" />}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                    Credit Card
                                                    {selectedRole !== 'ADMIN' && <Lock size={12} className="text-red-400" />}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence mode="wait">
                                                {customerData.map((customer, idx) => (
                                                    <motion.tr
                                                        key={`${customer.id}-${selectedRole}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="border-b border-slate-800 hover:bg-slate-800/50"
                                                    >
                                                        <td className="px-4 py-3 text-slate-300">{customer.id}</td>
                                                        <td className="px-4 py-3 text-slate-300">{customer.name}</td>

                                                        {/* Email - with masking animation */}
                                                        <td className="px-4 py-3 font-mono">
                                                            {showMaskAnimation ? (
                                                                <span className="text-red-400">{scrambleText(customer.email)}</span>
                                                            ) : (
                                                                <motion.span
                                                                    initial={{ filter: 'blur(10px)' }}
                                                                    animate={{ filter: 'blur(0px)' }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className={selectedRole === 'ADMIN' ? 'text-green-400' : 'text-red-400'}
                                                                >
                                                                    {applyMaskingPolicy(customer.email, 'email')}
                                                                </motion.span>
                                                            )}
                                                        </td>

                                                        {/* SSN - with masking animation */}
                                                        <td className="px-4 py-3 font-mono">
                                                            {showMaskAnimation ? (
                                                                <span className="text-red-400">{scrambleText(customer.ssn)}</span>
                                                            ) : (
                                                                <motion.span
                                                                    initial={{ filter: 'blur(10px)' }}
                                                                    animate={{ filter: 'blur(0px)' }}
                                                                    transition={{ duration: 0.3, delay: 0.1 }}
                                                                    className={selectedRole === 'ADMIN' ? 'text-green-400' : 'text-red-400'}
                                                                >
                                                                    {applyMaskingPolicy(customer.ssn, 'ssn')}
                                                                </motion.span>
                                                            )}
                                                        </td>

                                                        {/* Credit Card - with masking animation */}
                                                        <td className="px-4 py-3 font-mono">
                                                            {showMaskAnimation ? (
                                                                <span className="text-red-400">{scrambleText(customer.creditCard)}</span>
                                                            ) : (
                                                                <motion.span
                                                                    initial={{ filter: 'blur(10px)' }}
                                                                    animate={{ filter: 'blur(0px)' }}
                                                                    transition={{ duration: 0.3, delay: 0.2 }}
                                                                    className={selectedRole === 'ADMIN' ? 'text-green-400' : 'text-red-400'}
                                                                >
                                                                    {applyMaskingPolicy(customer.creditCard, 'creditCard')}
                                                                </motion.span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-slate-300">${customer.revenue.toLocaleString()}</td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SQL Policy Example */}
                            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                                <div className="text-xs font-bold text-slate-400 mb-2">Snowflake Masking Policy:</div>
                                <pre className="text-xs text-cyan-400 font-mono leading-relaxed">
                                    {`CREATE MASKING POLICY email_mask AS (val string) 
  RETURNS string ->
  CASE
    WHEN CURRENT_ROLE() IN ('ADMIN', 'COMPLIANCE') THEN val
    WHEN CURRENT_ROLE() = 'ANALYST' THEN REGEXP_REPLACE(val, '.+@', '****@')
    ELSE '*'.repeat(LENGTH(val))
  END;

-- Apply to column
ALTER TABLE customers 
  MODIFY COLUMN email 
  SET MASKING POLICY email_mask;`}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Row Access Policy */}
                    {activeTab === 'rowpolicy' && (
                        <div className="space-y-6">
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Info size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div><strong className="text-purple-400">Row Access Policy:</strong> Implicit WHERE clause injection. Users don't know other rows exist!</div>
                                        <div><strong className="text-purple-400">Multi-Tenancy:</strong> Perfect for SaaS applications isolating customer data by tenant_id or region.</div>
                                        <div><strong className="text-purple-400">Security:</strong> Even if users guess IDs, queries return zero rows. No data leakage.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Role & Region Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-slate-400 block mb-2">Role:</span>
                                    <div className="flex gap-2">
                                        {(['ADMIN', 'ANALYST'] as UserRole[]).map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setSelectedRole(role)}
                                                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedRole === role
                                                        ? role === 'ADMIN' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedRole === 'ANALYST' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <span className="text-sm text-slate-400 block mb-2">Assigned Region:</span>
                                        <div className="flex gap-2">
                                            {(['US', 'EU', 'APAC'] as Region[]).map(region => (
                                                <button
                                                    key={region}
                                                    onClick={() => setSelectedRegion(region)}
                                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedRegion === region
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {region}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Geographic Visualization */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                                <div className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                    <Globe size={16} />
                                    Global Data Points ({selectedRole === 'ADMIN' ? 'All Regions' : `${selectedRegion} Only`})
                                </div>

                                <div className="relative bg-slate-950 rounded-lg" style={{ height: '300px' }}>
                                    {/* World Map Simulation */}
                                    <svg className="w-full h-full">
                                        {/* Grid */}
                                        {[0, 33, 66, 100].map(x => (
                                            <line key={`v-${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#334155" strokeWidth="1" opacity="0.3" />
                                        ))}
                                        {[0, 33, 66, 100].map(y => (
                                            <line key={`h-${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#334155" strokeWidth="1" opacity="0.3" />
                                        ))}

                                        {/* Data Points */}
                                        <AnimatePresence>
                                            {geoData.map(point => {
                                                const isVisible = applyRowAccessPolicy(point);

                                                return (
                                                    <motion.g
                                                        key={point.id}
                                                        initial={{ scale: 1, opacity: 1 }}
                                                        animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        {/* Pulse effect for visible points */}
                                                        {isVisible && (
                                                            <motion.circle
                                                                cx={`${point.lng}%`}
                                                                cy={`${point.lat}%`}
                                                                r="20"
                                                                fill={
                                                                    point.region === 'US' ? '#3b82f6' :
                                                                        point.region === 'EU' ? '#8b5cf6' :
                                                                            '#f59e0b'
                                                                }
                                                                opacity="0.2"
                                                                animate={{ r: [15, 25, 15] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                            />
                                                        )}

                                                        <circle
                                                            cx={`${point.lng}%`}
                                                            cy={`${point.lat}%`}
                                                            r="8"
                                                            fill={
                                                                point.region === 'US' ? '#3b82f6' :
                                                                    point.region === 'EU' ? '#8b5cf6' :
                                                                        '#f59e0b'
                                                            }
                                                            opacity={isVisible ? "1" : "0.1"}
                                                        />

                                                        {isVisible && (
                                                            <text
                                                                x={`${point.lng}%`}
                                                                y={`${point.lat - 5}%`}
                                                                textAnchor="middle"
                                                                fill="white"
                                                                fontSize="10"
                                                                fontWeight="bold"
                                                            >
                                                                {point.region}
                                                            </text>
                                                        )}
                                                    </motion.g>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </svg>
                                </div>

                                {/* Stats */}
                                <div className="mt-4 flex items-center justify-between text-xs">
                                    <div className="text-slate-400">
                                        Visible Records: <span className="text-white font-bold">{visibleGeoData.length}</span> / {geoData.length}
                                    </div>
                                    {selectedRole !== 'ADMIN' && (
                                        <div className="text-red-400 flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            <span>{geoData.length - visibleGeoData.length} rows filtered by policy</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Table with Row Filtering */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-800 border-b border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Region</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {visibleCustomers.map((customer, idx) => (
                                                    <motion.tr
                                                        key={customer.id}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="border-b border-slate-800 hover:bg-slate-800/50"
                                                    >
                                                        <td className="px-4 py-3 text-slate-300">{customer.id}</td>
                                                        <td className="px-4 py-3 text-slate-300">{customer.name}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${customer.region === 'US' ? 'bg-blue-500/20 text-blue-400' :
                                                                    customer.region === 'EU' ? 'bg-purple-500/20 text-purple-400' :
                                                                        'bg-orange-500/20 text-orange-400'
                                                                }`}>
                                                                {customer.region}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-300">${customer.revenue.toLocaleString()}</td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SQL Policy Example */}
                            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                                <div className="text-xs font-bold text-slate-400 mb-2">Snowflake Row Access Policy:</div>
                                <pre className="text-xs text-purple-400 font-mono leading-relaxed">
                                    {`CREATE ROW ACCESS POLICY regional_isolation AS (region_col string) 
  RETURNS boolean ->
  CASE
    WHEN CURRENT_ROLE() = 'ADMIN' THEN TRUE  -- See everything
    WHEN CURRENT_ROLE() = 'US_MANAGER' THEN region_col = 'US'
    WHEN CURRENT_ROLE() = 'EU_MANAGER' THEN region_col = 'EU'
    WHEN CURRENT_ROLE() = 'APAC_MANAGER' THEN region_col = 'APAC'
    ELSE FALSE  -- Deny by default
  END;

-- Apply to table
ALTER TABLE customers 
  ADD ROW ACCESS POLICY regional_isolation ON (region);

-- User queries automatically filtered:
-- SELECT * FROM customers;  
-- -> WHERE region_col = <user's region>`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySimulator;
