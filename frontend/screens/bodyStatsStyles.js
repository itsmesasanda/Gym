import { StyleSheet } from 'react-native';

export const bodyStatsStyles = StyleSheet.create({
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
    logButton: {
        backgroundColor: '#C7F000',
        width: 170,
        height: 40,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    logButtonPlus: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
    },
    logButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
    },

    // Chart Container
    chartContainer: {
        backgroundColor: '#1C1C1E',
        paddingVertical: 16,
        paddingHorizontal: 0,
        marginBottom: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#2C2C2E',
        marginHorizontal: -16,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        paddingHorizontal: 16,
    },

    // Table Container
    tableContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 20,
    },

    // Table Header
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0F0F11',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        alignItems: 'center',
    },
    headerCell: {
        fontSize: 11,
        fontWeight: '700',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Table Row
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    dateCell: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    weightCell: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#C7F000',
    },
    bodyFatCell: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    waistCell: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionsCellContainer: {
        flex: 0.6,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    editIcon: {
        fontSize: 14,
        color: '#A1A1A6',
    },
    deleteIcon: {
        fontSize: 14,
        color: '#FF3B30',
    },

    // Row Divider
    rowDivider: {
        height: 1,
        backgroundColor: '#2C2C2E',
    },

    // Bottom Spacing
    bottomSpacing: {
        height: 20,
    },

    // Placeholder Container
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A1A1A6',
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
    },

    // Input Styles
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
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
        backgroundColor: '#1C1C1E',
        opacity: 0.8,
    },
    bodyFatDisplay: {
        backgroundColor: '#0F0F11',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        height: 48,
        justifyContent: 'center',
    },


    // Submit Button
    submitButton: {
        backgroundColor: '#C7F000',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },

    // Summary Card Styles
    summaryCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    summaryHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#A1A1A6',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    summaryDescription: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        lineHeight: 26,
    },
    summaryHighlight: {
        color: '#C7F000',
        fontWeight: '700',
    },
});
