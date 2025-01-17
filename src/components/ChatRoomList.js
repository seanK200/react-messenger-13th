import React, { useState, useEffect } from 'react';
import { PlusCircleFill } from 'react-bootstrap-icons';
import { Link, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useContacts } from '../contexts/ContactsProvider';
import { useRooms } from '../contexts/RoomsProvider';
import ChatRoomListItem from './ChatRoomListItem';

const StyledChatRoomList = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 15px;
  height: 40px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  padding: 0 15px;
  height: 100%;
  border-radius: 5px;
  background: #e3e3e3;
  font-size: 1em;
  text-align: center;
  flex: 1 1 auto;
  &:focus {
    text-align: left;
  }
`;

const CreateChatButton = styled.button`
  margin: 0 0 0 15px;
  background: #c6d8fc;
  outline: none;
  border: none;
  border-radius: 5px;
  padding: 0 15px;
  height: 100%;
  box-shadow: none;
  font-size: 1.3rem;
  display: flex;
  color: #0e388a;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  & span {
    margin-left: 0.8rem;
    display: none;
  }
  &:hover {
    font-size: 1rem;
  }
  &:hover span {
    display: block;
  }
`;

const ChatRoomListItems = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 0 15px;
  width: 100%;
`;

export default function ChatRoomList() {
  const history = useHistory();
  const { currentUser } = useContacts();
  const { currentUserRooms, createRoom } = useRooms();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState(currentUserRooms);

  useEffect(() => {
    setFilteredRooms(() =>
      currentUserRooms.filter((room) =>
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [currentUserRooms, searchQuery]);

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // 새 방 만들기
  const handleCreateChatButtonClick = () => {
    if (searchQuery !== '' && searchQuery !== null) {
      const query = searchQuery.split(' ');
      let roomName = query[0];
      let participants = [];
      if (query.length > 1) {
        // 검색 필드에 방이름 @사용자1 @사용자2.. 이런식으로 입력시 그 사용자가 초대된 상태로 새 방 생성
        for (let i = 1; i < query.length; i++) {
          if (query[i][0] === '@') {
            participants.push(query[i].slice(1));
          } else {
            roomName += ' ' + query[i];
          }
        }
        const newRoomId = createRoom(roomName, participants);
        if (newRoomId) {
          setSearchQuery('');
          history.push(`/room/${newRoomId}`);
        } else {
          alert('새 채팅방 만들기에 실패하였습니다.');
        }
      } else {
        // 검색 필드에 방이름 만 입력한 경우, 현재 사용자만 추가된 상태로 방 생성
        const newRoomId = createRoom(searchQuery, [currentUser.userId]);
        if (newRoomId) {
          setSearchQuery('');
          history.push(`/room/${newRoomId}`);
        } else {
          alert('새 채팅방 만들기에 실패하였습니다.');
        }
      }
    } else {
      // 검색 필드가 비어 있으면 새 방 이름을 입력할 수 있도록 prompt한 후 현재 사용자만 추가된 상태로 방 생성
      let newRoomName = window.prompt('새 방 이름 입력', '');
      if (newRoomName !== '' && newRoomName !== null) {
        const newRoomId = createRoom(newRoomName, [currentUser.userId]);
        if (newRoomId) {
          history.push(`/room/${newRoomId}`);
        } else {
          alert('새 채팅방 만들기에 실패하였습니다.');
        }
      }
    }
  };

  return (
    <StyledChatRoomList>
      <Actions>
        <SearchInput
          type="text"
          placeholder="채팅방 이름으로 검색..."
          value={searchQuery}
          onChange={handleSearchQueryChange}
        />
        <CreateChatButton onClick={handleCreateChatButtonClick}>
          <PlusCircleFill />
          <span>방 만들기</span>
        </CreateChatButton>
      </Actions>
      <ChatRoomListItems>
        {filteredRooms.map((room, idx) => (
          <Link to={`/room/${room.roomId}`} key={idx}>
            <ChatRoomListItem room={room} />
          </Link>
        ))}
        {filteredRooms.length === 0
          ? (searchQuery === ''
              ? `대화방 없음. `
              : `검색결과 없음. '${searchQuery}' `) +
            `방을 새로 만드시려면 '방 만들기'를 눌러주세요.`
          : ''}
      </ChatRoomListItems>
    </StyledChatRoomList>
  );
}
