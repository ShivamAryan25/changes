import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  Calendar,
  DollarSign,
} from "lucide-react";
import "./Subscriptions.css";
import type { Subscription } from "../types";

interface SubscriptionsProps {
  subscriptions: Subscription[];
  onAddSubscription: (subscription: Omit<Subscription, "id">) => void;
  onDeleteSubscription: (id: string) => void;
}

const Subscriptions: React.FC<SubscriptionsProps> = ({
  subscriptions,
  onAddSubscription,
  onDeleteSubscription,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    "Entertainment",
    "Music",
    "Productivity",
    "Design",
    "Shopping",
  ];

  const categoryColors: { [key: string]: string } = {
    Entertainment: "#2563eb",
    Music: "#3b82f6",
    Productivity: "#10b981",
    Design: "#f59e0b",
    Shopping: "#ef4444",
  };

  const filteredAndSortedSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === "all" || sub.category === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost":
          return b.cost - a.cost;
        case "renewal":
          return (
            new Date(a.renewalDate).getTime() -
            new Date(b.renewalDate).getTime()
          );
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("netflix")) return "🎬";
    if (name.includes("spotify")) return "🎵";
    if (name.includes("figma")) return "🎨";
    if (name.includes("adobe")) return "🎨";
    if (name.includes("notion")) return "📝";
    if (name.includes("amazon")) return "📦";
    if (name.includes("youtube")) return "📺";
    return "💼";
  };

  return (
    <div className="subscriptions">
      <div className="subscriptions-header">
        <div className="header-content">
          <h1>Subscriptions</h1>
          <p className="header-subtitle">
            View and manage all your subscriptions.
          </p>
        </div>
      </div>

      <div className="subscriptions-controls">
        <div className="search-and-filters">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <Filter className="filter-icon" size={20} />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <ArrowUpDown className="sort-icon" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="cost">Sort by Cost</option>
                <option value="renewal">Sort by Renewal</option>
              </select>
            </div>
          </div>
        </div>

        <button
          className="add-subscription-btn"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Add Subscription
        </button>
      </div>

      <div className="subscriptions-grid">
        {filteredAndSortedSubscriptions.length > 0 ? (
          filteredAndSortedSubscriptions.map((subscription) => (
            <div key={subscription.id} className="subscription-card">
              {/* Header with service info and menu */}
              <div className="card-top">
                <div className="service-header">
                  <div className="service-icon-wrapper">
                    <span className="service-emoji">
                      {subscription.icon || getServiceIcon(subscription.name)}
                    </span>
                  </div>
                  <div className="service-text">
                    <div className="service-title">{subscription.name}</div>
                    <div className="service-subtitle">
                      {subscription.plan || "Standard"}
                    </div>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteSubscription(subscription.id)}
                  title="Delete subscription"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cost section */}
              <div className="cost-info">
                <div className="cost-title">Cost</div>
                <div className="cost-amount">
                  ₹{subscription.cost.toFixed(2)}
                  <span className="cost-cycle">
                    /{subscription.billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
              </div>

              {/* Renewal section */}
              <div className="renewal-info">
                <div className="renewal-title">Next Renewal</div>
                <div className="renewal-value">
                  {formatDate(subscription.renewalDate)}
                </div>
              </div>

              {/* Category tag */}
              <div className="card-bottom">
                <span
                  className="category-badge"
                  style={{
                    backgroundColor:
                      categoryColors[subscription.category] || "#64748b",
                  }}
                >
                  {subscription.category}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h3>No subscriptions found</h3>
            <p>
              {subscriptions.length === 0
                ? "Add your first subscription to get started."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddSubscription}
          categories={categories}
        />
      )}
    </div>
  );
};

interface AddSubscriptionModalProps {
  onClose: () => void;
  onAdd: (subscription: Omit<Subscription, "id">) => void;
  categories: string[];
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  onClose,
  onAdd,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plan: "",
    cost: "",
    renewalDate: "",
    billingCycle: "monthly" as "monthly" | "annually",
    category: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.cost ||
      !formData.renewalDate ||
      !formData.category
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onAdd({
      name: formData.name,
      description: formData.description,
      plan: formData.plan || "Standard",
      cost: parseFloat(formData.cost),
      renewalDate: formData.renewalDate,
      billingCycle: formData.billingCycle,
      category: formData.category,
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Subscription</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <p className="modal-subtitle">
          Add a new subscription to track your spending.
        </p>

        <form onSubmit={handleSubmit} className="subscription-form">
          <div className="form-group">
            <label htmlFor="name">Service Name *</label>
            <input
              type="text"
              id="name"
              placeholder="e.g. Netflix"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              placeholder="e.g. Movie streaming service"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plan">Plan Type</label>
              <input
                type="text"
                id="plan"
                placeholder="e.g. Premium"
                value={formData.plan}
                onChange={(e) => handleInputChange("plan", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cost">Cost (₹) *</label>
              <input
                type="number"
                id="cost"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="renewalDate">Next Renewal Date *</label>
            <input
              type="date"
              id="renewalDate"
              value={formData.renewalDate}
              onChange={(e) => handleInputChange("renewalDate", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Billing Cycle *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="billingCycle"
                  value="monthly"
                  checked={formData.billingCycle === "monthly"}
                  onChange={(e) =>
                    handleInputChange("billingCycle", e.target.value)
                  }
                />
                <span className="radio-text">Monthly</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="billingCycle"
                  value="annually"
                  checked={formData.billingCycle === "annually"}
                  onChange={(e) =>
                    handleInputChange("billingCycle", e.target.value)
                  }
                />
                <span className="radio-text">Annually</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Add Subscription
          </button>
        </form>
      </div>
    </div>
  );
};

export default Subscriptions;
