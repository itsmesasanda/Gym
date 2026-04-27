import { StyleSheet } from 'react-native';

export const progressStyles = StyleSheet.create({
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
        fontSize: 24,
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
    },
    activeTab: {
        backgroundColor: '#C7F000',
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
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    addGoalButton: {
        backgroundColor: '#C7F000',
        width: 170,
        height: 40,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    addGoalPlus: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
    },
    addGoalText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
    },

    // Exercise Card
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },

    // Card Header
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    exerciseNameContainer: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    exerciseTarget: {
        fontSize: 12,
        fontWeight: '400',
        color: '#A1A1A6',
    },

    // Card Actions
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 16,
        color: '#A1A1A6',
    },

    // Progress Section
    progressSection: {
        backgroundColor: '#0F0F11',
        borderRadius: 12,
        padding: 12,
    },

    // Progress Header
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '400',
        color: '#A1A1A6',
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C7F000',
    },

    // Progress Bar
    progressBarContainer: {
        height: 8,
        backgroundColor: '#2C2C2E',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: '#A1A1A6',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    statSubtext: {
        fontSize: 10,
        fontWeight: '400',
        color: '#666666',
    },

    // Bottom Spacing
    bottomSpacing: {
        height: 100,
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
        paddingBottom: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    navItemActive: {
        // Active styling handled through navIconActive
    },
    navIcon: {
        fontSize: 20,
        marginBottom: 4,
        // kept for backward compatibility if using emoji
    },
    navIconImage: {
        width: 50,
        height: 50,
        marginBottom: 4,
        resizeMode: 'contain',
    },
    navIconActive: {
        // Highlighted for active state
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#A1A1A6',
    },
    navLabelActive: {
        color: '#C7F000',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    scrollContent: {
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#A1A1A6',
        fontWeight: '500',
    },

    // Form Styles
    formSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: '#0F0F11',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        height: 48,
    },
    disabledInput: {
        opacity: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    inputGroup: {
        flex: 1,
    },

    // Submit Button
    modalSubmitButton: {
        backgroundColor: '#C7F000',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    modalSubmitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },

    // ── Goals Card (Progress Style) ──────────────────────────
    goalsCard: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BF5AF233',
        marginTop: 16,
        marginBottom: 8,
        shadowColor: '#BF5AF2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        justifyContent: 'space-between',
    },
    goalsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    goalsValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    goalsCount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#BF5AF2',
    },
    goalsUnit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A1A1A6',
        marginLeft: 2,
    },
    goalsSubtext: {
        fontSize: 11,
        fontWeight: '500',
        color: '#FFFFFF88',
        marginTop: 4,
    },
    goalsBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: '#BF5AF222',
        borderWidth: 1,
        borderColor: '#BF5AF244',
        marginTop: 12,
    },
    goalsBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#BF5AF2',
    },


});
