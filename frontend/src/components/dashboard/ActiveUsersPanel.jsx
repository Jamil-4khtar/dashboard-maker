import { Users, Wifi, WifiOff } from "lucide-react";


export default function ActiveUsersPanel({ users, isConnected }) {
  return (
    <div className="active-users-panel">
      <div className="connection-status">
        {isConnected ? (
          <div className="status-connected">
            <Wifi size={16} />
            <span>Connected</span>
          </div>
        ) : (
          <div className="status-disconnected">
            <WifiOff size={16} />
            <span>Disconnected</span>
          </div>
        )}
      </div>
      
      {users.length > 0 && (
        <div className="users-list">
          <Users size={16} />
          <span>{users.length} active</span>
          <div className="user-avatars">
            {users.slice(0, 3).map((user) => (
              <div key={user.userId} className="user-avatar" title={user.userName}>
                {user.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className="user-avatar more">+{users.length - 3}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}