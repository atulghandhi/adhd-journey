const revenueCatPublicKey =
  process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY ??
  process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY ??
  null;

let configured = false;

interface OfferingSnapshot {
  identifier: string | null;
  priceString: string | null;
}

async function getPurchasesModule() {
  try {
    return await import("react-native-purchases");
  } catch {
    return null;
  }
}

async function ensureConfigured(userId?: string) {
  if (!revenueCatPublicKey) {
    return null;
  }

  const Purchases = await getPurchasesModule();

  if (!Purchases) {
    return null;
  }

  if (!configured) {
    await Purchases.default.configure({
      apiKey: revenueCatPublicKey,
      appUserID: userId,
    });
    configured = true;
  } else if (userId) {
    await Purchases.default.logIn(userId).catch(() => null);
  }

  return Purchases.default;
}

export function isRevenueCatConfigured() {
  return Boolean(revenueCatPublicKey);
}

export async function fetchRevenueCatOffering(userId?: string) {
  const purchases = await ensureConfigured(userId);

  if (!purchases) {
    return null;
  }

  try {
    const offerings = await purchases.getOfferings();
    const currentOffering = offerings.current;
    const primaryPackage = currentOffering?.availablePackages?.[0];

    return {
      identifier: currentOffering?.identifier ?? null,
      priceString: primaryPackage?.product.priceString ?? null,
    } satisfies OfferingSnapshot;
  } catch {
    return null;
  }
}

export async function purchasePrimaryOffering(userId?: string) {
  const purchases = await ensureConfigured(userId);

  if (!purchases) {
    return {
      purchased: false,
      stub: true,
    };
  }

  try {
    const offerings = await purchases.getOfferings();
    const packageToPurchase = offerings.current?.availablePackages?.[0];

    if (!packageToPurchase) {
      return {
        purchased: false,
        stub: false,
      };
    }

    const result = await purchases.purchasePackage(packageToPurchase);

    return {
      purchased: Object.keys(result.customerInfo.entitlements.active).length > 0,
      stub: false,
    };
  } catch {
    return {
      purchased: false,
      stub: false,
    };
  }
}

export async function hasActiveEntitlement(userId?: string) {
  const purchases = await ensureConfigured(userId);

  if (!purchases) {
    return false;
  }

  try {
    const customerInfo = await purchases.getCustomerInfo();

    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch {
    return false;
  }
}
