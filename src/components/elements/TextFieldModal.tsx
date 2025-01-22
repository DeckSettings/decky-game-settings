import {ModalRoot, ModalRootProps, Router, TextField} from "@decky/ui";
import {useEffect, useRef, useState} from 'react';

type props = ModalRootProps & {
    label: string,
    placeholder: string,
    onClosed: (searchQuery: string) => void;
}
export const TextFieldModal = ({closeModal, onClosed, label, placeholder}: props) => {
    const [searchText, setSearchText] = useState('');
    const textField = useRef<any>();

    const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const submit = () => {
        closeModal?.()
        onClosed(searchText)
    }

    useEffect(() => {
        console.log(`[TextFieldModal] Mounted`);
        Router.CloseSideMenus();
        //This will open up the virtual keyboard
        textField.current?.element?.click();
    }, []);

    return (
        <ModalRoot closeModal={closeModal} onOK={submit} onEscKeypress={closeModal}>
            <TextField
                //@ts-ignore
                ref={textField}
                focusOnMount={true}
                label={label}
                placeholder={placeholder}
                onChange={handleText}

            />
        </ModalRoot>
    );
};