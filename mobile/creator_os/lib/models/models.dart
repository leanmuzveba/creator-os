/// Shared domain models for CreatorOS, mirroring `src/types.ts` in the web app.
library;

/// A single shot in a video shot list (visual + audio + timing window).
class ShotItem {
  final int shot;
  final String visual;
  final String audio;
  final String timing;

  ShotItem({required this.shot, required this.visual, required this.audio, required this.timing});

  factory ShotItem.fromJson(Map<String, dynamic> json) => ShotItem(
        shot: json['shot'] ?? 0,
        visual: json['visual'] ?? '',
        audio: json['audio'] ?? '',
        timing: json['timing'] ?? '',
      );

  Map<String, dynamic> toJson() => {'shot': shot, 'visual': visual, 'audio': audio, 'timing': timing};
}

/// A post's generated video script (hook, body, CTA, shot list).
class PostScript {
  final String hook;
  final List<String> body;
  final String cta;
  final List<ShotItem> shotList;

  PostScript({required this.hook, required this.body, required this.cta, required this.shotList});

  factory PostScript.fromJson(Map<String, dynamic> json) => PostScript(
        hook: json['hook'] ?? '',
        body: List<String>.from(json['body'] ?? const []),
        cta: json['cta'] ?? '',
        shotList: (json['shotList'] as List? ?? const [])
            .map((e) => ShotItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'hook': hook,
        'body': body,
        'cta': cta,
        'shotList': shotList.map((e) => e.toJson()).toList(),
      };
}

/// A content item tracked from idea through to publication.
class PostItem {
  final String id;
  final String title;
  final String category;
  final List<String> platforms;
  final String status;
  final String? scheduledDate;
  final String? scheduledTime;
  final String? publishedDate;
  final String caption;
  final List<String> hashtags;
  final String thumbnailUrl;
  final String? videoUrl;
  final String? duration;
  final int? views;
  final int? likes;
  final int? comments;
  final int? shares;
  final int? bookmarks;
  final String? metricsGrowth;
  final PostScript? script;

  PostItem({
    required this.id,
    required this.title,
    required this.category,
    required this.platforms,
    required this.status,
    this.scheduledDate,
    this.scheduledTime,
    this.publishedDate,
    required this.caption,
    required this.hashtags,
    required this.thumbnailUrl,
    this.videoUrl,
    this.duration,
    this.views,
    this.likes,
    this.comments,
    this.shares,
    this.bookmarks,
    this.metricsGrowth,
    this.script,
  });

  factory PostItem.fromJson(Map<String, dynamic> json) => PostItem(
        id: json['id']?.toString() ?? '',
        title: json['title'] ?? '',
        category: json['category'] ?? '',
        platforms: List<String>.from(json['platforms'] ?? const []),
        status: json['status'] ?? 'draft',
        scheduledDate: json['scheduledDate'],
        scheduledTime: json['scheduledTime'],
        publishedDate: json['publishedDate'],
        caption: json['caption'] ?? '',
        hashtags: List<String>.from(json['hashtags'] ?? const []),
        thumbnailUrl: json['thumbnailUrl'] ?? '',
        videoUrl: json['videoUrl'],
        duration: json['duration'],
        views: json['views'],
        likes: json['likes'],
        comments: json['comments'],
        shares: json['shares'],
        bookmarks: json['bookmarks'],
        metricsGrowth: json['metricsGrowth'],
        script: json['script'] != null ? PostScript.fromJson(json['script']) : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'category': category,
        'platforms': platforms,
        'status': status,
        if (scheduledDate != null) 'scheduledDate': scheduledDate,
        if (scheduledTime != null) 'scheduledTime': scheduledTime,
        if (publishedDate != null) 'publishedDate': publishedDate,
        'caption': caption,
        'hashtags': hashtags,
        'thumbnailUrl': thumbnailUrl,
        if (videoUrl != null) 'videoUrl': videoUrl,
        if (duration != null) 'duration': duration,
        if (views != null) 'views': views,
        if (likes != null) 'likes': likes,
        if (comments != null) 'comments': comments,
        if (shares != null) 'shares': shares,
        if (bookmarks != null) 'bookmarks': bookmarks,
        if (metricsGrowth != null) 'metricsGrowth': metricsGrowth,
        if (script != null) 'script': script!.toJson(),
      };

  PostItem copyWith({String? status, String? publishedDate, int? views, int? likes, int? comments, int? shares, int? bookmarks}) =>
      PostItem(
        id: id,
        title: title,
        category: category,
        platforms: platforms,
        status: status ?? this.status,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        publishedDate: publishedDate ?? this.publishedDate,
        caption: caption,
        hashtags: hashtags,
        thumbnailUrl: thumbnailUrl,
        videoUrl: videoUrl,
        duration: duration,
        views: views ?? this.views,
        likes: likes ?? this.likes,
        comments: comments ?? this.comments,
        shares: shares ?? this.shares,
        bookmarks: bookmarks ?? this.bookmarks,
        metricsGrowth: metricsGrowth,
        script: script,
      );
}

/// A connected social platform account and its cached profile/metrics.
class SocialAccount {
  final String id; // PlatformType: tiktok | instagram | youtube | facebook
  final String name;
  final String handle;
  final bool connected;
  final String avatar;
  final String followers;
  final String views;
  final String viewsGrowth;
  final String color;
  final String accentColor;
  final String status;

  SocialAccount({
    required this.id,
    required this.name,
    required this.handle,
    required this.connected,
    required this.avatar,
    required this.followers,
    required this.views,
    required this.viewsGrowth,
    required this.color,
    required this.accentColor,
    required this.status,
  });

  factory SocialAccount.fromJson(Map<String, dynamic> json) => SocialAccount(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        handle: json['handle'] ?? '',
        connected: json['connected'] ?? false,
        avatar: json['avatar'] ?? '',
        followers: json['followers']?.toString() ?? '0',
        views: json['views']?.toString() ?? '0',
        viewsGrowth: json['viewsGrowth']?.toString() ?? '0%',
        color: json['color'] ?? '',
        accentColor: json['accentColor'] ?? '',
        status: json['status'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'handle': handle,
        'connected': connected,
        'avatar': avatar,
        'followers': followers,
        'views': views,
        'viewsGrowth': viewsGrowth,
        'color': color,
        'accentColor': accentColor,
        'status': status,
      };
}

/// A discoverable trend with adaptation guidance for the creator.
class TrendItem {
  final String id;
  final String topic;
  final String hashtag;
  final String growth;
  final String platform;
  final String volume;
  final String category;
  final String summary;
  final String whyItWorks;
  final String hookFormula;
  final String leanAdaptation;

  TrendItem({
    required this.id,
    required this.topic,
    required this.hashtag,
    required this.growth,
    required this.platform,
    required this.volume,
    required this.category,
    required this.summary,
    required this.whyItWorks,
    required this.hookFormula,
    required this.leanAdaptation,
  });

  factory TrendItem.fromJson(Map<String, dynamic> json) => TrendItem(
        id: json['id']?.toString() ?? '',
        topic: json['topic'] ?? '',
        hashtag: json['hashtag'] ?? '',
        growth: json['growth'] ?? '',
        platform: json['platform'] ?? '',
        volume: json['volume'] ?? '',
        category: json['category'] ?? '',
        summary: json['summary'] ?? '',
        whyItWorks: json['whyItWorks'] ?? '',
        hookFormula: json['hookFormula'] ?? '',
        leanAdaptation: json['leanAdaptation'] ?? '',
      );
}

/// The supported content pillars.
const List<String> kContentCategories = [
  'Tech Education',
  'Breaking Into Tech',
  'Free Tech Resources',
  'Student & Academic Life',
  'Microsoft Journey',
];

/// The selectable top-level navigation tabs / views.
enum ViewTab { dashboard, content, ai, analytics, trends, calendar }
