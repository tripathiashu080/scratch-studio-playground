
import React, { useState } from "react";

export default function CustomBlockModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [inputs, setInputs] = useState([]);
  const [inputName, setInputName] = useState("");
  const [inputType, setInputType] = useState("text");

  const addInput = () => {
    const trimmedName = inputName.trim();

    if (!trimmedName) return;

    setInputs((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: trimmedName,
        type: inputType,
      },
    ]);

    setInputName("");
  };

  const removeInput = (id) => {
    setInputs((current) => current.filter((input) => input.id !== id));
  };

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    onSave({
      id: `custom-${Date.now()}-${Math.random()}`,
      name: trimmedName,
      inputs,
      type: "custom",
      children: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-purple-600 px-5 py-4 text-white">
          <h2 className="text-lg font-bold">Make a Block</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 text-2xl hover:bg-purple-700"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label
              htmlFor="custom-block-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Block name
            </label>

            <input
              id="custom-block-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
              }}
              placeholder="e.g. Move Forward"
              maxLength={60}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-3 font-semibold text-gray-800">
              Optional inputs
            </h3>

            <div className="flex flex-wrap gap-2">
              <input
                value={inputName}
                onChange={(event) => setInputName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addInput();
                }}
                placeholder="Input name"
                maxLength={40}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />

              <select
                value={inputType}
                onChange={(event) => setInputType(event.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>

              <button
                type="button"
                onClick={addInput}
                disabled={!inputName.trim()}
                className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200 disabled:opacity-50"
              >
                + Add input
              </button>
            </div>

            {inputs.length > 0 && (
              <div className="mt-3 space-y-2">
                {inputs.map((input) => (
                  <div
                    key={input.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">
                      {input.name}
                      <span className="ml-2 text-xs text-gray-500">
                        ({input.type})
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => removeInput(input.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
