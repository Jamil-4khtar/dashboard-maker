export default function UserCursor({ user, cursor }) {
  if (!cursor) return null;

  return (
    <div 
      className="user-cursor"
      style={{
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="cursor-pointer" />
      <div className="cursor-label">{user.userName}</div>
    </div>
  );
}