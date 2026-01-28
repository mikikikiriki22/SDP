/**
 * Utils - Utility functions for DataTables, JWT parsing, and social sharing
 */
let Utils = {
    datatable: function (table_id, columns, data, pageLength = 15) {
        if ($.fn.dataTable.isDataTable("#" + table_id)) {
            $("#" + table_id)
                .DataTable()
                .destroy();
        }
        $("#" + table_id).DataTable({
            data: data,
            columns: columns,
            pageLength: pageLength,
            lengthMenu: [2, 5, 10, 15, 25, 50, 100, "All"],
        });
    },
    parseJwt: function (token) {
        if (!token) return null;
        try {
            const payload = token.split('.')[1];
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch (e) {
            // Token validation failed - handled silently
            return null;
        }
    },
    shareReview: function (platform, reviewData) {
        const fragranceName = reviewData.fragrance_name || 'Fragrance';
        const reviewerName = reviewData.reviewer_name || 'Anonymous';
        const rating = reviewData.rating || 'N/A';
        const comment = reviewData.comment || '';
        const stars = '⭐'.repeat(Math.floor(parseFloat(rating) || 0));

        // Share URL: use backend share page (og:image, full review) when we have review_id, else item page
        const backendBase = (typeof Constants !== 'undefined' && Constants.PROJECT_BASE_URL) ? Constants.PROJECT_BASE_URL : '';
        const sharePageUrl = (reviewData.review_id && backendBase)
            ? (backendBase.replace(/\/$/, '') + '/share/review/' + reviewData.review_id)
            : null;
        const itemPageUrl = (typeof window !== 'undefined' && window.location)
            ? (window.location.origin + window.location.pathname + `#item?id=${reviewData.parfume_id || ''}`)
            : ('#item?id=' + (reviewData.parfume_id || ''));
        const linkUrl = sharePageUrl || itemPageUrl;

        const shareText = `Check out my review of ${fragranceName} on AromaVerse!\n\n${stars} Rating: ${rating}/5\n\n"${comment}"\n\n- ${reviewerName}`;
        const fullShareText = shareText + '\n\n' + linkUrl;

        switch (platform) {
            case 'facebook':
                // Share the og-page URL so Facebook shows perfume image, full review, and link
                const fbUrl = encodeURIComponent(linkUrl);
                const fbQuote = encodeURIComponent(shareText);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}&quote=${fbQuote}`, '_blank', 'width=600,height=400');
                break;
            case 'twitter':
                // Share link + text so Twitter can show summary_large_image card
                const twUrl = encodeURIComponent(linkUrl);
                const twText = encodeURIComponent(shareText);
                window.open(`https://twitter.com/intent/tweet?url=${twUrl}&text=${twText}`, '_blank', 'width=600,height=400');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
                break;
            case 'instagram':
                const instagramText = `${shareText}\n\n${linkUrl}\n\n#AromaVerse #FragranceReview #Perfume`;
                navigator.clipboard.writeText(instagramText).then(function () {
                    toastr.success('Review copied! Open Instagram app and paste it in your post caption.');
                }, function () {
                    const textArea = document.createElement('textarea');
                    textArea.value = instagramText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toastr.success('Review copied! Open Instagram app and paste it in your post caption.');
                });
                break;
            case 'tiktok':
                const tiktokText = `${shareText}\n\n${linkUrl}\n\n#AromaVerse #FragranceReview #Perfume #Fragrance`;
                navigator.clipboard.writeText(tiktokText).then(function () {
                    toastr.success('Review copied! Open TikTok app and paste it in your video description.');
                }, function () {
                    const textArea = document.createElement('textarea');
                    textArea.value = tiktokText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toastr.success('Review copied! Open TikTok app and paste it in your video description.');
                });
                break;
            case 'copy':
                navigator.clipboard.writeText(fullShareText).then(function () {
                    toastr.success('Review copied to clipboard!');
                }, function () {
                    const textArea = document.createElement('textarea');
                    textArea.value = fullShareText;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    toastr.success('Review copied to clipboard!');
                });
                break;
            case 'native':
                if (navigator.share) {
                    navigator.share({
                        title: `My Review: ${fragranceName}`,
                        text: shareText,
                        url: linkUrl
                    }).catch(err => {
                        if (err.name !== 'AbortError') {
                            toastr.error('Error sharing review');
                        }
                    });
                } else {
                    Utils.shareReview('copy', reviewData);
                }
                break;
            default:
                toastr.error('Unknown sharing platform');
        }
    }
} 