import { StyleSheet, Platform } from 'react-native';

export const overviewStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    // Header Styles
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    activeTab: {
        backgroundColor: '#C7F000',
        borderColor: '#C7F000',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A1A1A6',
    },
    activeTabText: {
        color: '#000000',
    },

    // Content Styles
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },

    // Summary Cards Grid
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },

    // Summary Card
    summaryCard: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        justifyContent: 'space-between',
    },

    // Card Title
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },

    // Card Value Container
    valueContainer: {
        justifyContent: 'center',
    },

    // Card Value (the main number)
    cardValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#C7F000',
        marginBottom: 4,
    },

    // Card Subtitle (additional info)
    cardSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: '#A1A1A6',
    },

    // Card Badge/Status
    cardBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },

    // Badge for positive change (body fat decreased)
    badgePositive: {
        backgroundColor: '#34C75933',
    },

    // Badge for negative change (body fat increased)
    badgeNegative: {
        backgroundColor: '#FF453A33',
    },

    // Badge text
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Empty State
    emptyText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#A1A1A6',
        textAlign: 'center',
        marginTop: 32,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#2C2C2E',
        marginVertical: 16,
    },

    // ── Streak Card ────────────────────────────────────────────
    streakCard: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#C7F00033',
        marginBottom: 4,
        // subtle glow via shadow (works on iOS/web)
        shadowColor: '#C7F000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        justifyContent: 'space-between',
    },

    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },

    streakLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },

    streakValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
    },

    streakEmoji: {
        fontSize: 32,
        lineHeight: 40,
    },

    streakCount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#C7F000',
        marginBottom: 4,
    },

    streakUnit: {
        fontSize: 12,
        fontWeight: '400',
        color: '#A1A1A6',
        paddingBottom: 6,
    },

    streakBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#34C75933',
    },

    streakBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    streakProgressContainer: {
        marginBottom: 4,
        marginTop: 8,
    },

    streakProgressTrack: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },

    streakProgressFill: {
        height: '100%',
        backgroundColor: '#C7F000',
        borderRadius: 3,
    },

    streakProgressLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#A1A1A6',
    },

    streakMessage: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFFCC',
        fontStyle: 'italic',
    },

    // ── Summary Card (Trophy Style) ──────────────────────────
    summaryCardTrophy: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BF5AF233',
        marginBottom: 4,
        shadowColor: '#BF5AF2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        justifyContent: 'space-between',
    },

    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    summaryValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    summaryCount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#BF5AF2',
    },
    summaryTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A1A1A6',
        marginLeft: 2,
    },
    summaryProgressContainer: {
        marginTop: 12,
    },
    summaryProgressTrack: {
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        marginBottom: 8,
    },
    summaryProgressFill: {
        height: '100%',
        backgroundColor: '#BF5AF2',
        borderRadius: 3,
    },
    summaryProgressLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#A1A1A6',
    },
    summaryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#BF5AF222',
        borderWidth: 1,
        borderColor: '#BF5AF244',
        marginTop: 12,
    },
    summaryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#BF5AF2',
        textTransform: 'uppercase',
    },




    // Welcome heading above progress cards
    welcomeDividerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    welcomeHeading: {
        fontSize: 24, // Slightly reduced to fit better with lines
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
        marginHorizontal: 16,
        textAlign: 'center',
        flexShrink: 1, // Allow text to wrap if needed
    },
    cardCaption: {
        fontSize: 10,
        fontWeight: '600',
        color: '#A1A1A6',
        fontStyle: 'italic',
        marginTop: 4,
    },

    // Section Divider Styles
    sectionDividerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    sectionDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2C2C2E',
    },
    sectionDividerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginHorizontal: 12,
    },
});
