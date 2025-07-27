import { useState, useEffect } from "react";
import Actions from "../components/actions";
import Header from "../components/header";
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard({ user, sessionLoading, refreshSession }) {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.apikey) {
            fetchAnalyticsData();
        }
    }, [user]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://klyra-backend.vercel.app/analytics/${user.apikey}/analysis`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }
            const data = await response.json();
            setAnalyticsData(data.analysis);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div>Loading analytics data...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div>Error: {error}</div>
                    <button onClick={fetchAnalyticsData} style={{ marginTop: '10px', padding: '8px 16px' }}>
                        Retry
                    </button>
                </div>
            </>
        );
    }

    if (!analyticsData) {
        return (
            <>
                <Header />
                <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div>No analytics data available</div>
                </div>
            </>
        );
    }

    const { overview, pageAnalytics, clickAnalytics, userJourney, deviceAnalytics, realtimeAnalytics, userBehavior, performance, timePatterns, geographicData, sessionPatterns, conversionFunnel, insights } = analyticsData;

    return (
        <>
            <Header />
            <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '30px', color: '#333' }}>Analytics Dashboard</h1>
                
                {/* Overview Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>Total Pages</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{overview.totalPages}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>Total Page Visits</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{overview.totalPageVisits}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>Total Clicks</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{overview.totalClickEvents}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>User Journeys</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>{overview.totalJourneys}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>Active Users</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ea580c' }}>{realtimeAnalytics.currentActiveUsers}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3>Engagement Rate</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0891b2' }}>{userBehavior.engagementRate}%</div>
                    </div>
                </div>

                {/* Page Analytics */}
                {Object.keys(pageAnalytics).length > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>Page Analytics</h2>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Object.entries(pageAnalytics).map(([page, data]) => ({
                                    page,
                                    visits: data.totalVisits,
                                    duration: data.averageDuration
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="page" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="visits" fill="#2563eb" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                            {Object.entries(pageAnalytics).map(([page, data]) => (
                                <div key={page} style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                    <h4>{page}</h4>
                                    <div>Visits: {data.totalVisits}</div>
                                    <div>Avg Duration: {Math.round(data.averageDuration / 1000)}s</div>
                                    <div>Total Duration: {Math.round(data.totalDuration / 1000)}s</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Click Analytics */}
                {Object.keys(clickAnalytics).length > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>Click Analytics</h2>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(clickAnalytics).map(([button, data]) => ({
                                            name: button,
                                            value: data.totalClicks
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {Object.entries(clickAnalytics).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {Object.entries(clickAnalytics).map(([button, data]) => (
                                <div key={button} style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                    <h4>{button}</h4>
                                    <div>Total Clicks: {data.totalClicks}</div>
                                    <div>Click Rate: {data.clickRate}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User Journey */}
                {userJourney.totalJourneys > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>User Journey Analytics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Total Journeys</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userJourney.totalJourneys}</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Average Duration</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(userJourney.averageDuration / 60)}m {userJourney.averageDuration % 60}s</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Longest Journey</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(userJourney.longestJourney / 60)}m {userJourney.longestJourney % 60}s</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Shortest Journey</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(userJourney.shortestJourney / 60)}m {userJourney.shortestJourney % 60}s</div>
                            </div>
                        </div>
                        {userJourney.commonRoutes.length > 0 && (
                            <div>
                                <h3>Most Common Routes</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {userJourney.commonRoutes.map((route, index) => (
                                        <div key={index} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{route.route}</div>
                                            <div>Count: {route.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Device Analytics */}
                {deviceAnalytics.totalDevices > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>Device Analytics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Total Devices</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{deviceAnalytics.totalDevices}</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Average Memory</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{deviceAnalytics.averageMemory}GB</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Average Cores</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{deviceAnalytics.averageCores}</div>
                            </div>
                        </div>
                        
                        {Object.keys(deviceAnalytics.platforms).length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3>Platforms</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                    {Object.entries(deviceAnalytics.platforms).map(([platform, count]) => (
                                        <div key={platform} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{platform}</div>
                                            <div>{count} users</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Object.keys(deviceAnalytics.browsers).length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3>Browsers</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                    {Object.entries(deviceAnalytics.browsers).map(([browser, count]) => (
                                        <div key={browser} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{browser}</div>
                                            <div>{count} users</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Performance Metrics */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>Performance Metrics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Average Page Load Time</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(performance.averagePageLoadTime / 1000)}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Average Session Duration</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(performance.averageSessionDuration / 60)}m {performance.averageSessionDuration % 60}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Fastest Page Load</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(performance.fastestPageLoad / 1000)}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Slowest Page Load</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(performance.slowestPageLoad / 1000)}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Page Loads</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{performance.totalPageLoads}</div>
                        </div>
                    </div>
                </div>

                {/* Real-time Analytics */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>Real-time Analytics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Active Users</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{realtimeAnalytics.currentActiveUsers}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Sessions</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{realtimeAnalytics.totalSessions}</div>
                        </div>
                    </div>
                    {Object.keys(realtimeAnalytics.sessionDetails).length > 0 && (
                        <div>
                            <h3>Active Sessions</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                                {Object.entries(realtimeAnalytics.sessionDetails).map(([sessionId, session]) => (
                                    <div key={sessionId} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 'bold' }}>Session {sessionId.slice(0, 8)}</div>
                                        <div>Last Seen: {new Date(session.lastSeen).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Behavior */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>User Behavior</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Engagement</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(userBehavior.totalEngagement / 1000)}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Clicks</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userBehavior.totalClicks}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Average Session Duration</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(userBehavior.averageSessionDuration / 60)}m {userBehavior.averageSessionDuration % 60}s</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Engagement Rate</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userBehavior.engagementRate}%</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Session Count</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userBehavior.sessionCount}</div>
                        </div>
                    </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>Key Insights</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                            {insights.map((insight, index) => (
                                <div key={index} style={{ 
                                    padding: '15px', 
                                    background: insight.priority === 'high' ? '#fef2f2' : 
                                               insight.priority === 'medium' ? '#fffbeb' : '#f0fdf4', 
                                    borderRadius: '6px',
                                    borderLeft: `4px solid ${
                                        insight.priority === 'high' ? '#dc2626' : 
                                        insight.priority === 'medium' ? '#d97706' : '#059669'
                                    }`
                                }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight
                                    </div>
                                    <div>{insight.message}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                        Priority: {insight.priority}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time Patterns */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>Time Patterns</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Peak Activity Hour</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{timePatterns.peakHour.hour}</div>
                            <div>{timePatterns.peakHour.count} activities</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        {Object.entries(timePatterns.timeSlots).map(([hour, count]) => (
                            <div key={hour} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                <div style={{ fontWeight: 'bold' }}>{hour}</div>
                                <div>{count} activities</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geographic Data */}
                {geographicData.totalLocations > 0 && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2>Geographic Data</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Total Locations</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{geographicData.totalLocations}</div>
                            </div>
                            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                                <h4>Unique Locations</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{geographicData.uniqueLocations}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                            {geographicData.locations.map((location, index) => (
                                <div key={index} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Location {index + 1}</div>
                                    <div>Lat: {location.lat.toFixed(4)}</div>
                                    <div>Lng: {location.lng.toFixed(4)}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {new Date(location.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Session Patterns */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>Session Patterns</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Sessions</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sessionPatterns.totalSessions}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Average Sessions/Day</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(sessionPatterns.averageSessionsPerDay * 100) / 100}</div>
                        </div>
                    </div>
                    {Object.keys(sessionPatterns.sessionsByDate).length > 0 && (
                        <div>
                            <h3>Sessions by Date</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                {Object.entries(sessionPatterns.sessionsByDate).map(([date, sessions]) => (
                                    <div key={date} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{date}</div>
                                        <div>{sessions.length} sessions</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Conversion Funnel */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h2>Conversion Funnel</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Most Common Entry Point</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{conversionFunnel.mostCommonEntryPoint}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4>Total Route Transitions</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{conversionFunnel.totalRouteTransitions}</div>
                        </div>
                    </div>
                    {Object.keys(conversionFunnel.routeFrequency).length > 0 && (
                        <div>
                            <h3>Route Frequency</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                {Object.entries(conversionFunnel.routeFrequency)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 10)
                                    .map(([route, count]) => (
                                    <div key={route} style={{ padding: '10px', background: '#f1f5f9', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{route}</div>
                                        <div>{count} visits</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}