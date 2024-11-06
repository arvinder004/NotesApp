import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import NoteCard from "../../components/Cards/NoteCard";

const Home = () => {
    return (
        <>
            <Navbar />

            <div className="container mx-auto">
                <div className="grid grid-cols-3 gap-4 mt-8 ">
                    <NoteCard
                        title="meeting on 7 april"
                        date={"3 april"}
                        content="asdasdifbvsjd sdivu asd sdi eipsufhiweufn iweufh kdjfvn diufhiu i sdi dsiwf iscn sdfnsdvbn srgh"
                        tags="#meeting"
                        onEdit={() => { }}
                        onDelete={() => { }}
                        onPinNote={() => { }}
                    />
                </div>
            </div>
        </>
    )
}

export default Home