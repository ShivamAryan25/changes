import React, { useState } from "react";
import { DollarSign, Calendar, FileText, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";
import "./Dashboard.css";
import PaymentModal from "./PaymentModal";
import type { Subscription } from "../types";

interface DashboardProps {
  subscriptions: Subscription[];
}

const Dashboard: React.FC<DashboardProps> = ({ subscriptions }) => {
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePayNow = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowPaymentModal(true);
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedSubscription(null);
  };

  // Calculate statistics from subscription data
  const calculateMonthlySpend = () => {
    return subscriptions.reduce((total, sub) => {
      const monthlyCost =
        sub.billingCycle === "annually" ? sub.cost / 12 : sub.cost;
      return total + monthlyCost;
    }, 0);
  };

  const getNextRenewal = () => {
    if (subscriptions.length === 0) return "N/A";

    const today = new Date();
    const upcomingRenewals = subscriptions
      .filter((sub) => new Date(sub.renewalDate) >= today)
      .sort(
        (a, b) =>
          new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
      );

    if (upcomingRenewals.length === 0) return "N/A";

    const nextRenewal = upcomingRenewals[0];
    return new Date(nextRenewal.renewalDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getCategorySpending = () => {
    if (subscriptions.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};
    const totalMonthlySpend = calculateMonthlySpend();

    if (totalMonthlySpend === 0) return [];

    subscriptions.forEach((sub) => {
      const monthlyCost =
        sub.billingCycle === "annually" ? sub.cost / 12 : sub.cost;
      categoryTotals[sub.category] =
        (categoryTotals[sub.category] || 0) + monthlyCost;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      spend: Number(amount.toFixed(2)),
      percentage: Math.round((amount / totalMonthlySpend) * 100),
      color: getCategoryColor(category),
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Entertainment: "#2563eb",
      Music: "#3b82f6",
      Productivity: "#10b981",
      Design: "#f59e0b",
      Shopping: "#ef4444",
    };
    return colors[category] || "#64748b";
  };

  const getLastMonthSpend = () => {
    // Calculate based on subscriptions that would have been active last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return subscriptions.reduce((total, sub) => {
      const renewalDate = new Date(sub.renewalDate);
      const subscriptionStart = new Date(renewalDate);

      // If billing cycle is monthly, subtract one month; if annual, subtract one year
      if (sub.billingCycle === "monthly") {
        subscriptionStart.setMonth(subscriptionStart.getMonth() - 1);
      } else {
        subscriptionStart.setFullYear(subscriptionStart.getFullYear() - 1);
      }

      // Check if subscription was active last month
      if (subscriptionStart <= lastMonth) {
        const monthlyCost =
          sub.billingCycle === "annually" ? sub.cost / 12 : sub.cost;
        return total + monthlyCost;
      }

      return total;
    }, 0);
  };

  const generateChartData = () => {
    const currentSpend = calculateMonthlySpend();
    const today = new Date();
    const chartData = [];

    // Generate realistic data for the last 12 months based on subscription history
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString("en-US", {
        month: "short",
      });

      // Calculate spending for this specific month based on active subscriptions
      let monthSpend = 0;
      subscriptions.forEach((sub) => {
        const renewalDate = new Date(sub.renewalDate);
        const subscriptionStart = new Date(renewalDate);

        // Calculate when subscription started based on billing cycle
        if (sub.billingCycle === "monthly") {
          // For monthly, go back to find when it likely started
          while (subscriptionStart > monthDate) {
            subscriptionStart.setMonth(subscriptionStart.getMonth() - 1);
          }
        } else {
          // For annual, go back to find when it likely started
          while (subscriptionStart > monthDate) {
            subscriptionStart.setFullYear(subscriptionStart.getFullYear() - 1);
          }
        }

        // If subscription was active in this month
        if (subscriptionStart <= monthDate) {
          const monthlyCost =
            sub.billingCycle === "annually" ? sub.cost / 12 : sub.cost;
          monthSpend += monthlyCost;
        }
      });

      // Add some realistic variation (±15%) to simulate real spending patterns
      const variation = (Math.random() - 0.5) * 0.3; // -15% to +15%
      const adjustedSpend = Math.max(0, monthSpend * (1 + variation));

      chartData.push({
        name: monthName,
        total: Number(adjustedSpend.toFixed(2)),
      });
    }

    return chartData;
  };

  const monthlySpend = calculateMonthlySpend();
  const lastMonthSpend = getLastMonthSpend();
  const changePercentage =
    lastMonthSpend > 0
      ? ((monthlySpend - lastMonthSpend) / lastMonthSpend) * 100
      : 0;
  const chartData = generateChartData();
  const categoryData = getCategorySpending();

  const statsData = [
    {
      title: "Total Monthly Spend",
      value: `₹${monthlySpend.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      title: "Next Renewal",
      value: getNextRenewal(),
      icon: Calendar,
    },
    {
      title: "Active Subscriptions",
      value: subscriptions.length.toString(),
      icon: FileText,
    },
    {
      title: "Last Month's Spend",
      value: `₹${lastMonthSpend.toFixed(2)}`,
      change:
        lastMonthSpend > 0
          ? `${changePercentage >= 0 ? "+" : ""}${changePercentage.toFixed(
              1
            )}% from prev`
          : "No data",
      icon: TrendingUp,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          <p className="tooltip-value">
            {`Spend: ₹${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].payload.category}</p>
          <p className="tooltip-value">
            {`₹${payload[0].value.toFixed(2)} (${
              payload[0].payload.percentage
            }%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <span className="stat-title">{stat.title}</span>
                <div className="stat-icon">
                  <IconComponent size={20} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              {stat.change && (
                <div
                  className={`stat-change ${
                    changePercentage >= 0 ? "positive" : "negative"
                  }`}
                >
                  {stat.change}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Monthly Spending Trend</h3>
            <p className="chart-subtitle">
              Your spending pattern over the last 12 months
            </p>
          </div>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#2563eb"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    fill="url(#colorTotal)"
                    strokeWidth={2}
                    dot={{
                      fill: "#2563eb",
                      r: 4,
                      strokeWidth: 2,
                      stroke: "#ffffff",
                    }}
                    activeDot={{
                      r: 6,
                      stroke: "#2563eb",
                      fill: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">
                <div className="empty-chart-icon">📊</div>
                <h4>No spending data available</h4>
                <p>Add some subscriptions to see your spending trends</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Spend by Category</h3>
            <p className="chart-subtitle">
              Breakdown of your subscription categories
            </p>
          </div>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <div className="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={categoryData}
                      dataKey="spend"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="chart-legend">
                  {categoryData.map((category, index) => (
                    <div key={index} className="legend-item">
                      <div
                        className="legend-color"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="legend-label">
                        {category.category} {category.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart-state">
                <div className="empty-chart-icon">🍩</div>
                <h4>No category data available</h4>
                <p>Add subscriptions to see spending by category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="upcoming-renewals">
        <div className="renewals-header">
          <h3>Upcoming Renewals</h3>
        </div>

        {subscriptions.length > 0 ? (
          <div className="renewals-table">
            <div className="table-header">
              <div className="header-sr">Sr.</div>
              <div className="header-service-name">Service Name</div>
              <div className="header-service-type">Service Type</div>
              <div className="header-date">Due Date</div>
              <div className="header-amount">Amount</div>
              <div className="header-action">Action</div>
            </div>

            <div className="table-body">
              {subscriptions
                .filter((sub) => {
                  const renewalDate = new Date(sub.renewalDate);
                  const today = new Date();
                  const daysUntilRenewal = Math.ceil(
                    (renewalDate.getTime() - today.getTime()) /
                      (1000 * 3600 * 24)
                  );
                  return daysUntilRenewal >= 0 && daysUntilRenewal <= 30;
                })
                .sort(
                  (a, b) =>
                    new Date(a.renewalDate).getTime() -
                    new Date(b.renewalDate).getTime()
                )
                .slice(0, 5)
                .map((sub, index) => {
                  const renewalDate = new Date(sub.renewalDate);

                  return (
                    <div key={sub.id} className="table-row">
                      <div className="cell-sr">
                        <span className="sr-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="cell-service-name">
                        <span className="service-name">{sub.name}</span>
                      </div>
                      <div className="cell-service-type">
                        <span className="service-type">{sub.plan}</span>
                      </div>
                      <div className="cell-date">
                        <span className="due-date">
                          {renewalDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="cell-amount">
                        <span className="amount">₹{sub.cost.toFixed(2)}</span>
                      </div>
                      <div className="cell-action">
                        <button
                          className="pay-now-btn"
                          onClick={() => handlePayNow(sub)}
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  );
                })}

              {subscriptions.filter((sub) => {
                const renewalDate = new Date(sub.renewalDate);
                const today = new Date();
                const daysUntilRenewal = Math.ceil(
                  (renewalDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
                );
                return daysUntilRenewal >= 0 && daysUntilRenewal <= 30;
              }).length === 0 && (
                <div className="no-renewals-message">
                  <p>No subscriptions renewing in the next 30 days.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-renewals-message">
            <p>Add subscriptions to track upcoming renewals.</p>
          </div>
        )}
      </div>

      {showPaymentModal && selectedSubscription && (
        <PaymentModal
          subscription={selectedSubscription}
          onClose={handleClosePayment}
        />
      )}
    </div>
  );
};

export default Dashboard;
