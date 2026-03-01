import { MedusaService } from "@medusajs/framework/utils";
import LoanProduct from "./models/loan-product";
import LoanApplication from "./models/loan-application";
import InsuranceProduct from "./models/insurance-product";
import InsurancePolicy from "./models/insurance-policy";
import InvestmentPlan from "./models/investment-plan";

class FinancialProductModuleService extends MedusaService({
  LoanProduct,
  LoanApplication,
  InsuranceProduct,
  InsurancePolicy,
  InvestmentPlan,
}) {
  /**
   * Calculate projected returns for an investment product based on amount and term in months.
   */
  async calculateReturns(
    productId: string,
    amount: number,
    term: number,
  ): Promise<{
    principal: number;
    projectedReturn: number;
    totalValue: number;
    annualRate: number;
  }> {
    const plan = await this.retrieveInvestmentPlan(productId) as any;
    // @ts-ignore - InvestmentPlan doesn't have annual_return_rate property
    const annualRate = Number(plan.annual_return_rate || 0.08);
    const years = term / 12;
    const projectedReturn = amount * Math.pow(1 + annualRate, years) - amount;
    return {
      principal: amount,
      projectedReturn: Math.round(projectedReturn * 100) / 100,
      totalValue: Math.round((amount + projectedReturn) * 100) / 100,
      annualRate,
    };
  }

  /**
   * Create a new investment for a customer in a specific financial product.
   */
  async createInvestment(
    productId: string,
    customerId: string,
    amount: number,
  ): Promise<any> {
    const plan = await this.retrieveInvestmentPlan(productId) as any;
    if (plan.min_investment && amount < Number(plan.min_investment)) {
      throw new Error(`Minimum investment amount is ${plan.min_investment}`);
    }
    const risk = await this.assessRisk(productId);
    const application = await this.createLoanApplications({
      product_id: productId,
      customer_id: customerId,
      amount,
      status: "active",
      risk_level: risk.riskLevel,
      invested_at: new Date(),
    } as any);
    return application;
  }

  /**
   * Get the complete investment portfolio for a customer across all products.
   */
  async getPortfolio(customerId: string): Promise<any> {
    const investments = await this.listLoanApplications({
      customer_id: customerId,
      status: "active",
    }) as any;
    const list = Array.isArray(investments)
      ? investments
      : [investments].filter(Boolean);
    let totalInvested = 0;
    const holdings = [];
    for (const inv of list) {
      totalInvested += Number(inv.amount || 0);
      holdings.push({
        id: inv.id,
        productId: inv.product_id,
        amount: Number(inv.amount || 0),
      });
    }
    return {
      customerId,
      totalInvested,
      holdings,
      holdingsCount: holdings.length,
    };
  }

  /**
   * Assess the risk level of a financial product based on its configuration.
   */
  async assessRisk(
    productId: string,
  ): Promise<{ riskLevel: string; riskScore: number }> {
    const plan = await this.retrieveInvestmentPlan(productId) as any;
    // @ts-ignore - InvestmentPlan doesn't have annual_return_rate property
    const annualRate = Number(plan.annual_return_rate || 0.08);
    let riskScore = 0;
    if (annualRate > 0.15) riskScore = 80;
    else if (annualRate > 0.1) riskScore = 60;
    else if (annualRate > 0.05) riskScore = 40;
    else riskScore = 20;
    const riskLevel =
      riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : "low";
    return { riskLevel, riskScore };
  }

  async applyForProduct(
    customerId: string,
    productId: string,
    data: {
      amount: number;
      term: number;
      purpose?: string;
    },
  ): Promise<any> {
    if (!customerId || !productId) {
      throw new Error("Customer ID and product ID are required");
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (!data.term || data.term <= 0) {
      throw new Error("Term must be greater than zero");
    }

    const product = await this.retrieveLoanProduct(productId) as any;
    if (product.min_amount && data.amount < Number(product.min_amount)) {
      throw new Error(`Amount below minimum of ${product.min_amount}`);
    }
    if (product.max_amount && data.amount > Number(product.max_amount)) {
      throw new Error(`Amount exceeds maximum of ${product.max_amount}`);
    }

    return await this.createLoanApplications({
      customer_id: customerId,
      product_id: productId,
      amount: data.amount,
      term_months: data.term,
      purpose: data.purpose || null,
      status: "pending",
      applied_at: new Date(),
    } as any);
  }

  async assessApplication(applicationId: string): Promise<{
    eligible: boolean;
    reasons: string[];
    score: number;
  }> {
    const application = await this.retrieveLoanApplication(applicationId) as any;
    const reasons: string[] = [];
    let score = 100;

    if (!application.customer_id) {
      reasons.push("Missing customer information");
      score -= 30;
    }
    if (!application.amount || Number(application.amount) <= 0) {
      reasons.push("Invalid loan amount");
      score -= 40;
    }
    if (!application.term_months && !application.term) {
      reasons.push("Missing loan term");
      score -= 20;
    }

    if (application.product_id) {
      try {
        const product = await this.retrieveLoanProduct(application.product_id) as any;
        const amount = Number(application.amount);
        if (product.min_amount && amount < Number(product.min_amount)) {
          reasons.push(`Amount below product minimum of ${product.min_amount}`);
          score -= 25;
        }
        if (product.max_amount && amount > Number(product.max_amount)) {
          reasons.push(
            `Amount exceeds product maximum of ${product.max_amount}`,
          );
          score -= 25;
        }
      } catch {
        reasons.push("Unable to verify product details");
        score -= 10;
      }
    }

    const eligible = score >= 60 && reasons.length === 0;
    return { eligible, reasons, score: Math.max(0, score) };
  }

  async approveApplication(
    applicationId: string,
    approvedBy: string,
    terms?: {
      interestRate?: number;
      fees?: number;
    },
  ): Promise<any> {
    const application = await this.retrieveLoanApplication(applicationId) as any;
    if (application.status === "approved") {
      throw new Error("Application is already approved");
    }
    if (application.status === "rejected") {
      throw new Error("Cannot approve a rejected application");
    }

    return await this.updateLoanApplications({
      id: applicationId,
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date(),
      interest_rate: terms?.interestRate || null,
      fees: terms?.fees || null,
    } as any);
  }

  async rejectApplication(applicationId: string, reason: string): Promise<any> {
    if (!reason) {
      throw new Error("Rejection reason is required");
    }

    const application = await this.retrieveLoanApplication(applicationId) as any;
    if (application.status === "approved") {
      throw new Error("Cannot reject an approved application");
    }
    if (application.status === "rejected") {
      throw new Error("Application is already rejected");
    }

    return await this.updateLoanApplications({
      id: applicationId,
      status: "rejected",
      rejection_reason: reason,
      rejected_at: new Date(),
    } as any);
  }

  calculateRepaymentSchedule(
    principal: number,
    interestRate: number,
    termMonths: number,
  ): {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  } {
    if (principal <= 0) throw new Error("Principal must be greater than zero");
    if (interestRate < 0) throw new Error("Interest rate cannot be negative");
    if (termMonths <= 0) throw new Error("Term must be greater than zero");

    const monthlyRate = interestRate / 100 / 12;
    let monthlyPayment: number;

    if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    monthlyPayment = Math.round(monthlyPayment * 100) / 100;

    const schedule = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
      const principalPayment =
        Math.round((monthlyPayment - interestPayment) * 100) / 100;
      balance = Math.round((balance - principalPayment) * 100) / 100;

      if (month === termMonths) {
        balance = 0;
      }

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    const totalPayment = Math.round(monthlyPayment * termMonths * 100) / 100;
    const totalInterest = Math.round((totalPayment - principal) * 100) / 100;

    return { monthlyPayment, totalInterest, totalPayment, schedule };
  }
}

export default FinancialProductModuleService;
